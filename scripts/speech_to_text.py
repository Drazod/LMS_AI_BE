#!/usr/bin/env python3
"""
Speech-to-Text conversion script for LMS
Converts MP3 audio files to text using speech recognition
"""

import sys
import os
import json
import tempfile
import argparse
from pathlib import Path

try:
    import speech_recognition as sr
    from pydub import AudioSegment
    import nltk
    from sentence_transformers import SentenceTransformer
    import numpy as np
    import openai
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"Missing required dependencies: {str(e)}",
        "message": "Please install required packages: pip install speechrecognition pydub nltk sentence-transformers openai"
    }))
    sys.exit(1)

class SpeechToTextProcessor:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        # Initialize embedding model
        try:
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            print(json.dumps({
                "success": False,
                "error": f"Failed to load embedding model: {str(e)}"
            }))
            sys.exit(1)
    
    def validate_audio_file(self, input_path):
        """Validate audio file before processing"""
        try:
            # Check file exists and size
            if not os.path.exists(input_path):
                return False, "File does not exist"
                
            file_size = os.path.getsize(input_path)
            if file_size == 0:
                return False, "File is empty"
                
            if file_size < 1024:  # Less than 1KB is suspicious
                return False, "File too small to contain valid audio"
                
            # Check if file exceeds reasonable size limit (100MB = 104,857,600 bytes)
            max_size = 100 * 1024 * 1024  # 100MB
            if file_size > max_size:
                return False, f"File size ({file_size / (1024*1024):.1f}MB) exceeds maximum allowed size (100MB)"
                
            # Try to detect file type
            try:
                import subprocess
                result = subprocess.run(['file', '-b', '--mime-type', input_path], 
                                      capture_output=True, text=True, timeout=10)
                mime_type = result.stdout.strip()
                
                if not any(x in mime_type for x in ['audio/', 'video/', 'application/octet-stream']):
                    return False, f"Invalid file type: {mime_type}"
            except:
                pass  # file command not available or failed
                
            return True, "Valid"
            
        except Exception as e:
            return False, f"Validation error: {str(e)}"
    
    def _repair_and_load_mp3(self, input_path):
        """Attempt to repair corrupted MP3 using FFmpeg and reload"""
        import subprocess
        
        try:
            # Create temporary repaired file
            with tempfile.NamedTemporaryFile(suffix="_repaired.mp3", delete=False) as temp_file:
                repaired_path = temp_file.name
            
            # Use FFmpeg to repair the MP3 file
            ffmpeg_cmd = [
                'ffmpeg', '-y',  # Overwrite output file
                '-err_detect', 'ignore_err',  # Ignore errors
                '-ignore_unknown',  # Ignore unknown streams
                '-fflags', '+genpts',  # Generate presentation timestamps
                '-i', input_path,  # Input file
                '-c:a', 'mp3',  # Audio codec
                '-ar', '44100',  # Sample rate
                '-ac', '2',  # Channels
                '-b:a', '128k',  # Bitrate
                repaired_path  # Output file
            ]
            
            result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, timeout=120)
            
            if result.returncode != 0:
                raise Exception(f"FFmpeg repair failed: {result.stderr}")
            
            # Try to load the repaired file
            audio = AudioSegment.from_mp3(repaired_path)
            
            # Cleanup the temporary repaired file
            try:
                os.unlink(repaired_path)
            except:
                pass
                
            return audio
            
        except Exception as e:
            # Cleanup any temporary files
            try:
                if 'repaired_path' in locals():
                    os.unlink(repaired_path)
            except:
                pass
            raise Exception(f"MP3 repair process failed: {str(e)}")
    
    def _convert_with_ffmpeg(self, input_path, output_format="wav"):
        """Use FFmpeg directly to convert any audio/video file to WAV"""
        import subprocess
        
        try:
            # Create temporary output file
            with tempfile.NamedTemporaryFile(suffix=f".{output_format}", delete=False) as temp_file:
                output_path = temp_file.name
            
            # Build FFmpeg command with robust parameters
            ffmpeg_cmd = [
                'ffmpeg', '-y',  # Overwrite output file
                '-hide_banner',  # Hide FFmpeg banner
                '-loglevel', 'error',  # Only show errors
                '-err_detect', 'ignore_err',  # Ignore stream errors
                '-ignore_unknown',  # Ignore unknown streams
                '-fflags', '+genpts',  # Generate presentation timestamps
                '-i', input_path,  # Input file
                '-vn',  # No video (extract audio only)
                '-ar', '16000',  # Sample rate for speech recognition
                '-ac', '1',  # Mono audio
                '-acodec', 'pcm_s16le',  # PCM 16-bit codec
                '-f', output_format,  # Output format
                output_path  # Output file
            ]
            
            result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                raise Exception(f"FFmpeg conversion failed (exit code {result.returncode}): {result.stderr}")
            
            # Verify output file was created
            if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
                raise Exception("FFmpeg conversion produced empty output file")
            
            return output_path
            
        except Exception as e:
            # Cleanup any temporary files
            try:
                if 'output_path' in locals() and os.path.exists(output_path):
                    os.unlink(output_path)
            except:
                pass
            raise Exception(f"FFmpeg conversion process failed: {str(e)}")
    
    def convert_to_wav(self, input_path):
        """Convert MP3, MP4, or other audio/video formats to WAV format for speech recognition"""
        try:
            file_extension = Path(input_path).suffix.lower()
            
            # Validate file exists and is not empty
            if not os.path.exists(input_path):
                raise Exception(f"File does not exist: {input_path}")
            
            file_size = os.path.getsize(input_path)
            if file_size == 0:
                raise Exception(f"File is empty: {input_path}")
            
            # Try multiple approaches for loading audio files
            audio = None
            errors = []
            
            # Load audio/video file with fallback strategies
            if file_extension == '.mp3':
                try:
                    # First try: direct MP3 loading
                    audio = AudioSegment.from_mp3(input_path)
                except Exception as e1:
                    errors.append(f"MP3 direct load failed: {str(e1)}")
                    try:
                        # Second try: generic file loader
                        audio = AudioSegment.from_file(input_path, format="mp3")
                    except Exception as e2:
                        errors.append(f"MP3 generic load failed: {str(e2)}")
                        try:
                            # Third try: force mp3 format with parameters
                            audio = AudioSegment.from_file(input_path, format="mp3", 
                                                         parameters=["-ignore_unknown", "-err_detect", "ignore_err"])
                        except Exception as e3:
                            errors.append(f"MP3 forced load failed: {str(e3)}")
                            try:
                                # Fourth try: use FFmpeg directly to repair and convert
                                audio = self._repair_and_load_mp3(input_path)
                            except Exception as e4:
                                errors.append(f"MP3 repair failed: {str(e4)}")
                            
            elif file_extension == '.mp4':
                # Extract audio from MP4 video
                audio = AudioSegment.from_file(input_path, format="mp4")
            elif file_extension == '.avi':
                audio = AudioSegment.from_file(input_path, format="avi")
            elif file_extension == '.mov':
                audio = AudioSegment.from_file(input_path, format="mov")
            elif file_extension == '.mkv':
                # MKV is a container format, try different approaches
                try:
                    audio = AudioSegment.from_file(input_path, format="matroska")
                except Exception as mkv_error:
                    try:
                        # Fallback: use generic file loader
                        audio = AudioSegment.from_file(input_path)
                    except Exception as generic_error:
                        errors.append(f"MKV matroska load failed: {str(mkv_error)}")
                        errors.append(f"MKV generic load failed: {str(generic_error)}")
                        # Try with FFmpeg parameters
                        audio = AudioSegment.from_file(input_path, 
                                                     parameters=["-f", "matroska", "-i"])
            elif file_extension == '.flv':
                audio = AudioSegment.from_file(input_path, format="flv")
            elif file_extension == '.webm':
                audio = AudioSegment.from_file(input_path, format="webm")
            elif file_extension == '.wav':
                audio = AudioSegment.from_wav(input_path)
            elif file_extension == '.m4a':
                audio = AudioSegment.from_file(input_path, format="m4a")
            elif file_extension == '.aac':
                audio = AudioSegment.from_file(input_path, format="aac")
            else:
                # Try to load as generic audio/video file
                try:
                    audio = AudioSegment.from_file(input_path)
                except Exception as e:
                    errors.append(f"Generic load failed: {str(e)}")
                    
            if audio is None:
                # Final fallback: use FFmpeg directly
                try:
                    print(f"All pydub methods failed, trying FFmpeg direct conversion...")
                    wav_path = self._convert_with_ffmpeg(input_path, "wav")
                    audio = AudioSegment.from_wav(wav_path)
                    # Cleanup temporary WAV file
                    try:
                        os.unlink(wav_path)
                    except:
                        pass
                    print(f"FFmpeg conversion successful")
                except Exception as ffmpeg_error:
                    errors.append(f"FFmpeg fallback failed: {str(ffmpeg_error)}")
                    error_msg = f"Failed to load audio file {input_path}. All methods failed. Errors: {'; '.join(errors)}"
                    raise Exception(error_msg)
            
            # Validate audio was loaded successfully
            if len(audio) == 0:
                raise Exception("Loaded audio has zero duration")
                
            # Optimize audio for speech recognition
            # Convert to mono if stereo (reduces processing time)
            if audio.channels > 1:
                audio = audio.set_channels(1)
            
            # Normalize audio levels (with error handling)
            try:
                audio = audio.normalize()
            except Exception as e:
                print(f"Warning: Could not normalize audio: {str(e)}")
            
            # Set sample rate to 16kHz for better speech recognition
            try:
                audio = audio.set_frame_rate(16000)
            except Exception as e:
                print(f"Warning: Could not set frame rate: {str(e)}")
            
            # Convert to WAV and save to temporary file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
                try:
                    audio.export(temp_wav.name, format="wav", 
                               parameters=["-ar", "16000", "-ac", "1", "-acodec", "pcm_s16le"])
                    return temp_wav.name, len(audio) / 1000.0  # Return duration in seconds
                except Exception as e:
                    # Fallback export without parameters
                    audio.export(temp_wav.name, format="wav")
                    return temp_wav.name, len(audio) / 1000.0
                
        except Exception as e:
            raise Exception(f"Error converting {file_extension} to WAV: {str(e)}")
    
    def analyze_audio_quality(self, audio_segment):
        """Analyze audio quality to help diagnose transcription issues"""
        try:
            analysis = {
                "duration_seconds": len(audio_segment) / 1000.0,
                "sample_rate": audio_segment.frame_rate,
                "channels": audio_segment.channels,
                "has_content": True
            }
            
            # Check for silence or very quiet audio
            if audio_segment.max_possible_amplitude > 0:
                rms_level = audio_segment.rms / audio_segment.max_possible_amplitude
                analysis["rms_level"] = rms_level
                analysis["is_very_quiet"] = rms_level < 0.001
                analysis["is_quiet"] = rms_level < 0.01
            else:
                analysis["rms_level"] = 0
                analysis["is_very_quiet"] = True
                analysis["is_quiet"] = True
                analysis["has_content"] = False
            
            # Check duration appropriateness
            analysis["too_short"] = analysis["duration_seconds"] < 0.5
            analysis["too_long"] = analysis["duration_seconds"] > 600  # 10 minutes
            
            return analysis
        except Exception as e:
            return {"error": f"Audio analysis failed: {str(e)}"}

    def transcribe_audio(self, input_path):
        """Transcribe audio/video file to text with enhanced error reporting"""
        try:
            # First validate the input file
            is_valid, validation_msg = self.validate_audio_file(input_path)
            if not is_valid:
                return {
                    "success": False,
                    "error": f"File validation failed: {validation_msg}",
                    "message": "Please check your audio file and try again"
                }
            
            file_extension = Path(input_path).suffix.lower()
            duration_seconds = 0
            
            # Convert to WAV if not already in WAV format
            if file_extension != '.wav':
                wav_path, duration_seconds = self.convert_to_wav(input_path)
                cleanup_wav = True
            else:
                wav_path = input_path
                cleanup_wav = False
                # Get duration for WAV files
                try:
                    audio = AudioSegment.from_wav(wav_path)
                    duration_seconds = len(audio) / 1000.0
                except:
                    duration_seconds = 0
            
            # Analyze audio quality for diagnostic purposes
            try:
                audio = AudioSegment.from_wav(wav_path) if file_extension != '.wav' else AudioSegment.from_wav(input_path)
                quality_analysis = self.analyze_audio_quality(audio)
                
                # Provide specific feedback based on audio analysis
                if quality_analysis.get("too_short"):
                    return {
                        "success": False,
                        "error": f"Audio too short ({quality_analysis['duration_seconds']:.1f}s) for reliable transcription",
                        "suggestion": "Please provide audio longer than 0.5 seconds"
                    }
                
                if quality_analysis.get("is_very_quiet"):
                    return {
                        "success": False,
                        "error": "Audio appears to be silent or extremely quiet",
                        "suggestion": "Please check recording volume and ensure the audio contains audible speech",
                        "audio_info": {
                            "duration": f"{quality_analysis['duration_seconds']:.1f}s",
                            "volume_level": "Very Low"
                        }
                    }
                    
            except Exception as e:
                print(f"Warning: Audio quality analysis failed: {e}")
                quality_analysis = {}
            
            # Check if audio is too long (limit to 10 minutes for free tier)
            if duration_seconds > 600:  # 10 minutes
                return {
                    "success": False,
                    "error": f"Audio duration ({duration_seconds:.1f}s) exceeds maximum limit of 10 minutes",
                    "message": "Please upload shorter audio/video files for processing"
                }
                return None
            
            # Transcribe audio in chunks if it's long (>1 minute)
            if duration_seconds > 60:
                text = self._transcribe_long_audio(wav_path, duration_seconds)
            else:
                text = self._transcribe_short_audio(wav_path)
            
            # Cleanup temporary WAV file if created
            if cleanup_wav and os.path.exists(wav_path):
                os.unlink(wav_path)
            
            return text, duration_seconds
            
        except Exception as e:
            raise Exception(f"Error transcribing audio: {str(e)}")
    
    def _transcribe_short_audio(self, wav_path):
        """Transcribe short audio files (<=1 minute) with multiple recognition strategies"""
        try:
            # Load and analyze audio first
            audio = AudioSegment.from_wav(wav_path)
            
            # Check if audio has content (not just silence)
            if len(audio) < 500:  # Less than 0.5 seconds
                return "Audio too short for transcription"
            
            # Check audio levels to detect silence
            if audio.max_possible_amplitude > 0:
                audio_level = audio.rms / audio.max_possible_amplitude
                if audio_level < 0.001:  # Very quiet audio, likely silence
                    return "Audio appears to be silent or very quiet"
            
            # Enhance audio quality for better recognition
            try:
                # Normalize volume
                audio = audio.normalize()
                # Convert to optimal format for speech recognition
                audio = audio.set_frame_rate(16000).set_channels(1)
                
                # Save enhanced audio
                with tempfile.NamedTemporaryFile(suffix="_enhanced.wav", delete=False) as enhanced_file:
                    audio.export(enhanced_file.name, format="wav", 
                               parameters=["-ar", "16000", "-ac", "1", "-acodec", "pcm_s16le"])
                    enhanced_path = enhanced_file.name
                
                # Use enhanced audio for recognition
                wav_path = enhanced_path
                cleanup_enhanced = True
            except Exception as e:
                print(f"Warning: Audio enhancement failed: {e}")
                cleanup_enhanced = False
            
            with sr.AudioFile(wav_path) as source:
                # Adjust for ambient noise with longer duration for better accuracy
                self.recognizer.adjust_for_ambient_noise(source, duration=1.0)
                audio_data = self.recognizer.record(source)
            
            # Try multiple recognition engines in order of preference
            recognition_attempts = [
                ("Google (English)", lambda: self.recognizer.recognize_google(audio_data, language='en-US')),
                ("Google (Auto)", lambda: self.recognizer.recognize_google(audio_data)),
                ("Google (UK English)", lambda: self.recognizer.recognize_google(audio_data, language='en-GB')),
            ]
            
            last_error = None
            for engine_name, recognition_func in recognition_attempts:
                try:
                    result = recognition_func()
                    if result and result.strip():
                        print(f"Successfully transcribed using {engine_name}")
                        return result.strip()
                except sr.UnknownValueError:
                    last_error = f"{engine_name}: Could not understand audio"
                    continue
                except sr.RequestError as e:
                    last_error = f"{engine_name}: Service error - {str(e)}"
                    continue
                except Exception as e:
                    last_error = f"{engine_name}: Unexpected error - {str(e)}"
                    continue
            
            # All recognition attempts failed
            return f"Could not understand audio. Last error: {last_error}"
            
        except Exception as e:
            return f"Transcription error: {str(e)}"
        finally:
            # Cleanup enhanced audio file if created
            if 'cleanup_enhanced' in locals() and cleanup_enhanced:
                try:
                    os.unlink(enhanced_path)
                except:
                    pass
    
    def _transcribe_long_audio(self, wav_path, duration_seconds):
        """Transcribe long audio files by breaking them into chunks"""
        try:
            # Load the audio file
            audio = AudioSegment.from_wav(wav_path)
            
            # Split audio into 30-second chunks
            chunk_length_ms = 30 * 1000  # 30 seconds
            chunks = []
            transcripts = []
            
            for i in range(0, len(audio), chunk_length_ms):
                chunk = audio[i:i + chunk_length_ms]
                
                # Save chunk to temporary file
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_chunk:
                    chunk.export(temp_chunk.name, format="wav")
                    
                    # Transcribe the chunk
                    try:
                        chunk_text = self._transcribe_short_audio(temp_chunk.name)
                        if chunk_text and chunk_text != "Could not understand audio":
                            transcripts.append(chunk_text)
                    except Exception as e:
                        print(f"Warning: Failed to transcribe chunk {i//chunk_length_ms + 1}: {str(e)}")
                    finally:
                        # Cleanup chunk file
                        os.unlink(temp_chunk.name)
            
            if not transcripts:
                return "Could not understand audio"
            
            # Combine all transcripts
            full_transcript = " ".join(transcripts)
            
            # Clean up the transcript (remove duplicate phrases that might occur at chunk boundaries)
            words = full_transcript.split()
            cleaned_words = []
            for i, word in enumerate(words):
                # Simple duplicate removal - skip if same word appears within 3 positions
                if i < 3 or word.lower() not in [w.lower() for w in words[i-3:i]]:
                    cleaned_words.append(word)
            
            return " ".join(cleaned_words)
            
        except Exception as e:
            raise Exception(f"Error transcribing long audio: {str(e)}")
    
    def create_embeddings(self, text):
        """Create embeddings from text"""
        try:
            # Split text into sentences for better embeddings
            sentences = nltk.sent_tokenize(text)
            
            # Generate embeddings
            embeddings = self.embedding_model.encode(sentences)
            
            # Convert to list for JSON serialization
            embeddings_list = [embedding.tolist() for embedding in embeddings]
            
            return {
                "sentences": sentences,
                "embeddings": embeddings_list,
                "embedding_dimension": len(embeddings_list[0]) if embeddings_list else 0
            }
        except Exception as e:
            raise Exception(f"Error creating embeddings: {str(e)}")
    
    def generate_ai_summary(self, text):
        """Generate AI-powered summary of the text"""
        try:
            # Check if OpenAI API key is available
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                # Fallback to basic summary
                sentences = nltk.sent_tokenize(text)
                if len(sentences) <= 3:
                    return text
                # Return first 3 sentences as basic summary
                return ' '.join(sentences[:3])
            
            # Use OpenAI for intelligent summarization
            client = openai.OpenAI(api_key=api_key)
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at summarizing audio transcripts for educational purposes. Create a concise, clear summary that captures the main points and key information."
                    },
                    {
                        "role": "user",
                        "content": f"Please summarize this audio transcript in 2-3 sentences, focusing on the main points:\n\n{text}"
                    }
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            # Fallback to basic summary if AI fails
            sentences = nltk.sent_tokenize(text)
            if len(sentences) <= 3:
                return text
            return ' '.join(sentences[:3])

    def generate_questions(self, text, num_questions=5):
        """Generate IELTS-style listening comprehension questions based on the transcribed text"""
        try:
            # First, generate a summary
            summary = self.generate_ai_summary(text)
            
            # Check if OpenAI API key is available for advanced question generation
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                return self._generate_basic_questions(text, summary, num_questions)
            
            # Use OpenAI for intelligent question generation
            client = openai.OpenAI(api_key=api_key)
            
            prompt = f"""
Based on this audio transcript and its summary, create {num_questions} IELTS-style listening comprehension questions.

AUDIO TRANSCRIPT:
{text}

SUMMARY:
{summary}

Create questions in these formats:
1. Multiple choice questions (4 options: A, B, C, D)
2. Fill-in-the-blank questions
3. True/False/Not Given questions
4. Short answer questions

For each question, provide:
- The question text
- Question type
- Correct answer
- Multiple choice options (if applicable)
- Difficulty level (Basic/Intermediate/Advanced)
- The specific part of the text that supports the answer

Format your response as JSON with this structure:
{{
    "summary": "summary text here",
    "questions": [
        {{
            "question": "question text",
            "type": "multiple_choice|fill_blank|true_false|short_answer",
            "difficulty": "Basic|Intermediate|Advanced",
            "correct_answer": "correct answer",
            "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
            "context": "relevant text from transcript",
            "explanation": "why this is the correct answer"
        }}
    ]
}}
"""

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert IELTS exam question writer. Create high-quality listening comprehension questions that test understanding, inference, and detail recognition. Always respond with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1000,
                temperature=0.4
            )
            
            # Parse the AI response
            import json
            ai_response = json.loads(response.choices[0].message.content)
            
            return {
                "summary": ai_response.get("summary", summary),
                "questions": ai_response.get("questions", [])
            }
            
        except Exception as e:
            # Fallback to basic question generation
            return self._generate_basic_questions(text, summary, num_questions)

    def _generate_basic_questions(self, text, summary, num_questions=5):
        """Fallback method for basic question generation when AI is not available"""
        try:
            questions = []
            sentences = nltk.sent_tokenize(text)
            
            # Question templates for different types
            question_templates = [
                {
                    "type": "multiple_choice",
                    "template": "According to the audio, what is mentioned about {}?",
                    "difficulty": "Basic"
                },
                {
                    "type": "true_false", 
                    "template": "The audio states that {}",
                    "difficulty": "Basic"
                },
                {
                    "type": "fill_blank",
                    "template": "The speaker mentions that _______ {}",
                    "difficulty": "Intermediate"
                },
                {
                    "type": "short_answer",
                    "template": "What does the speaker say about {}?",
                    "difficulty": "Intermediate"
                }
            ]
            
            # Extract key phrases for question generation
            words = text.split()
            key_phrases = []
            
            # Find important nouns and phrases (basic NLP)
            for i, word in enumerate(words):
                if len(word) > 4 and word.lower() not in ['this', 'that', 'which', 'where', 'when', 'what']:
                    context = ' '.join(words[max(0, i-2):i+3])
                    key_phrases.append((word, context))
            
            # Generate questions using templates
            for i, (phrase, context) in enumerate(key_phrases[:num_questions]):
                template = question_templates[i % len(question_templates)]
                
                question_data = {
                    "question": template["template"].format(phrase.lower()),
                    "type": template["type"],
                    "difficulty": template["difficulty"],
                    "context": context,
                    "correct_answer": "Based on the audio content",
                    "explanation": f"This information can be found in the audio transcript."
                }
                
                # Add options for multiple choice
                if template["type"] == "multiple_choice":
                    question_data["options"] = [
                        f"A) {phrase} is mentioned positively",
                        f"B) {phrase} is not discussed",
                        f"C) {phrase} is mentioned with concern", 
                        f"D) {phrase} is mentioned briefly"
                    ]
                    question_data["correct_answer"] = "A"
                
                questions.append(question_data)
            
            # Add a summary question
            if len(text) > 100 and len(questions) < num_questions:
                questions.append({
                    "question": "What is the main topic discussed in this audio?",
                    "type": "short_answer",
                    "difficulty": "Basic",
                    "context": summary,
                    "correct_answer": "Based on the summary",
                    "explanation": "The main topic can be inferred from the overall content."
                })
            
            return {
                "summary": summary,
                "questions": questions[:num_questions]
            }
            
        except Exception as e:
            raise Exception(f"Error generating basic questions: {str(e)}")
    
    def process_audio_file(self, audio_path, generate_questions_flag=True, num_questions=5):
        """Main processing function"""
        try:
            # Verify file exists
            if not os.path.exists(audio_path):
                raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
            # Transcribe audio/video to text
            transcription_result = self.transcribe_audio(audio_path)
            
            if transcription_result is None:
                return {
                    "success": False,
                    "error": "Audio processing failed - file may be too long or invalid"
                }
            
            if isinstance(transcription_result, tuple):
                transcribed_text, duration_seconds = transcription_result
            else:
                transcribed_text = transcription_result
                duration_seconds = 0
            
            # Check transcription results with detailed feedback
            if not transcribed_text or transcribed_text.strip() == "":
                return {
                    "success": False,
                    "error": "No transcription generated - audio file may be empty or contain no speech",
                    "suggestion": "Please ensure the audio file contains clear speech and is not corrupted"
                }
            
            if "Could not understand audio" in transcribed_text or "Audio too short" in transcribed_text:
                return {
                    "success": False,
                    "error": f"Speech recognition failed: {transcribed_text}",
                    "suggestion": "Try with clearer audio, reduce background noise, or check if the audio contains speech"
                }
            
            if "Audio appears to be silent" in transcribed_text:
                return {
                    "success": False, 
                    "error": "Audio file appears to contain only silence or very quiet audio",
                    "suggestion": "Please check your audio recording volume and ensure it contains audible speech"
                }
            
            if transcribed_text.startswith("Transcription error:"):
                return {
                    "success": False,
                    "error": transcribed_text,
                    "suggestion": "Please check the audio file format and try again"
                }
            
            # Create embeddings
            embedding_data = self.create_embeddings(transcribed_text)
            
            # Generate questions and summary if requested
            questions = []
            summary = ""
            if generate_questions_flag:
                question_data = self.generate_questions(transcribed_text, num_questions)
                if isinstance(question_data, dict):
                    questions = question_data.get("questions", [])
                    summary = question_data.get("summary", "")
                else:
                    questions = question_data
                    summary = self.generate_ai_summary(transcribed_text)
            
            return {
                "success": True,
                "transcribed_text": transcribed_text,
                "summary": summary,
                "word_count": len(transcribed_text.split()),
                "embeddings": embedding_data,
                "questions": questions,
                "metadata": {
                    "file_path": audio_path,
                    "file_size": os.path.getsize(audio_path),
                    "file_type": Path(audio_path).suffix.lower(),
                    "duration_seconds": duration_seconds,
                    "processed_at": str(Path().absolute())
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

def diagnose_audio_file(audio_path):
    """Diagnose audio file issues for troubleshooting"""
    processor = SpeechToTextProcessor()
    
    try:
        print(f"🔍 Diagnosing audio file: {audio_path}")
        print("=" * 50)
        
        # File validation
        is_valid, validation_msg = processor.validate_audio_file(audio_path)
        print(f"File Validation: {'✅ PASS' if is_valid else '❌ FAIL'}")
        if not is_valid:
            print(f"  Issue: {validation_msg}")
            return
        
        # Audio loading test
        file_extension = Path(audio_path).suffix.lower()
        try:
            if file_extension != '.wav':
                wav_path, duration = processor.convert_to_wav(audio_path)
                print(f"Audio Conversion: ✅ PASS (Duration: {duration:.1f}s)")
                cleanup_wav = True
            else:
                wav_path = audio_path
                cleanup_wav = False
                audio = AudioSegment.from_wav(wav_path)
                duration = len(audio) / 1000.0
                print(f"Audio Loading: ✅ PASS (Duration: {duration:.1f}s)")
        except Exception as e:
            print(f"Audio Conversion: ❌ FAIL - {str(e)}")
            return
        
        # Audio quality analysis
        try:
            audio = AudioSegment.from_wav(wav_path)
            analysis = processor.analyze_audio_quality(audio)
            print(f"Audio Analysis:")
            print(f"  Duration: {analysis['duration_seconds']:.1f}s")
            print(f"  Sample Rate: {analysis['sample_rate']}Hz")
            print(f"  Channels: {analysis['channels']}")
            print(f"  Volume Level: {'Very Low' if analysis.get('is_very_quiet') else 'Low' if analysis.get('is_quiet') else 'Good'}")
            
            if analysis.get('too_short'):
                print(f"  ⚠️  Audio too short for reliable transcription")
            if analysis.get('is_very_quiet'):
                print(f"  ⚠️  Audio appears silent or very quiet")
                
        except Exception as e:
            print(f"Audio Analysis: ❌ FAIL - {str(e)}")
        
        # Quick transcription test (first 10 seconds)
        try:
            print("Running transcription test...")
            if duration > 10:
                test_audio = audio[:10000]  # First 10 seconds
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                    test_audio.export(temp_file.name, format="wav")
                    test_result = processor._transcribe_short_audio(temp_file.name)
                    os.unlink(temp_file.name)
            else:
                test_result = processor._transcribe_short_audio(wav_path)
                
            if test_result and "Could not understand" not in test_result and "error:" not in test_result.lower():
                print(f"Transcription Test: ✅ PASS")
                print(f"  Sample: \"{test_result[:100]}{'...' if len(test_result) > 100 else ''}\"")
            else:
                print(f"Transcription Test: ❌ FAIL - {test_result}")
                
        except Exception as e:
            print(f"Transcription Test: ❌ FAIL - {str(e)}")
        
        # Cleanup
        if cleanup_wav and os.path.exists(wav_path):
            os.unlink(wav_path)
            
        print("=" * 50)
        print("Diagnosis complete!")
            
    except Exception as e:
        print(f"Diagnosis failed: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description='Convert speech to text and generate questions from audio/video files')
    parser.add_argument('input_file', help='Path to the audio/video file (MP3, MP4, WAV, AVI, MOV, etc.)')
    parser.add_argument('--no-questions', action='store_true', help='Skip question generation')
    parser.add_argument('--num-questions', type=int, default=5, help='Number of questions to generate')
    parser.add_argument('--output', help='Output file path (default: stdout)')
    parser.add_argument('--diagnose', action='store_true', help='Run diagnostic tests on the audio file')
    
    args = parser.parse_args()
    
    if args.diagnose:
        diagnose_audio_file(args.input_file)
        return
    
    # Download required NLTK data
    try:
        nltk.download('punkt', quiet=True)
    except:
        pass  # Continue if download fails
    
    # Initialize processor
    processor = SpeechToTextProcessor()
    
    # Process the audio/video file
    result = processor.process_audio_file(
        args.input_file, 
        generate_questions_flag=not args.no_questions,
        num_questions=args.num_questions
    )
    
    # Output result
    json_output = json.dumps(result, indent=2)
    
    if args.output:
        with open(args.output, 'w') as f:
            f.write(json_output)
    else:
        print(json_output)

if __name__ == "__main__":
    main()