import { Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { SpeechToTextResponse, ApiResponse, FileUploadResponse } from '../models/response';
import { config } from '../config/config';

export class SpeechToTextController {
  
  /**
   * Convert uploaded audio/video file to text using Python speech recognition
   */
  public async transcribeAudio(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No audio file provided',
          message: 'Please upload an audio or video file'
        } as ApiResponse);
        return;
      }

      const { generateQuestions = true, numQuestions = 5 } = req.body;
      const audioFilePath = req.file.path;

      // Validate file format
      const allowedFormats = ['.mp3', '.mp4', '.wav', '.avi', '.mov', '.mkv', '.flv', '.webm', '.m4a', '.aac'];
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      
      if (!allowedFormats.includes(fileExtension)) {
        // Clean up uploaded file
        await this.cleanupFile(audioFilePath);
        
        res.status(400).json({
          success: false,
          error: `Unsupported file format: ${fileExtension}`,
          message: `Supported formats: ${allowedFormats.join(', ')}`
        } as ApiResponse);
        return;
      }

      // Call Python speech-to-text script
      const result = await this.callPythonScript(audioFilePath, {
        generateQuestions,
        numQuestions
      });

      // Clean up uploaded file
      await this.cleanupFile(audioFilePath);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result,
          message: 'Audio transcribed successfully'
        } as ApiResponse<SpeechToTextResponse>);
      } else {
        res.status(422).json({
          success: false,
          error: result.error || 'Transcription failed',
          message: result.suggestion || 'Please try with a different audio file'
        } as ApiResponse);
      }

    } catch (error) {
      console.error('Transcription error:', error);
      
      // Clean up file if it exists
      if (req.file?.path) {
        await this.cleanupFile(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error during transcription',
        message: 'Please try again later'
      } as ApiResponse);
    }
  }

  /**
   * Diagnose audio file issues for troubleshooting
   */
  public async diagnoseAudio(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No audio file provided',
          message: 'Please upload an audio or video file to diagnose'
        } as ApiResponse);
        return;
      }

      const audioFilePath = req.file.path;

      // Call Python script with diagnose flag
      const result = await this.callPythonScript(audioFilePath, { diagnose: true });

      // Clean up uploaded file
      await this.cleanupFile(audioFilePath);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Audio diagnosis completed'
      } as ApiResponse);

    } catch (error) {
      console.error('Audio diagnosis error:', error);
      
      if (req.file?.path) {
        await this.cleanupFile(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error during diagnosis',
        message: 'Please try again later'
      } as ApiResponse);
    }
  }

  /**
   * Call Python speech-to-text script
   */
  private async callPythonScript(
    audioFilePath: string, 
    options: { generateQuestions?: boolean; numQuestions?: number; diagnose?: boolean }
  ): Promise<SpeechToTextResponse> {
    
    return new Promise((resolve, reject) => {
      const scriptPath = path.resolve(config.python.scriptPath);
      const args = [scriptPath, audioFilePath];

      // Add options
      if (options.diagnose) {
        args.push('--diagnose');
      } else {
        if (!options.generateQuestions) {
          args.push('--no-questions');
        }
        if (options.numQuestions && options.numQuestions !== 5) {
          args.push('--num-questions', options.numQuestions.toString());
        }
      }

      console.log(`Executing Python script: python ${args.join(' ')}`);

      const pythonProcess = spawn('python', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Try to parse JSON output
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            // If not JSON, treat as plain text output (for diagnose mode)
            resolve({
              success: true,
              transcribedText: stdout,
              message: 'Process completed'
            });
          }
        } else {
          console.error(`Python script exited with code ${code}`);
          console.error('Stderr:', stderr);
          console.error('Stdout:', stdout);
          
          // Try to parse error from stdout if it's JSON
          try {
            const errorResult = JSON.parse(stdout);
            resolve(errorResult);
          } catch {
            resolve({
              success: false,
              error: `Python script failed with exit code ${code}`,
              suggestion: 'Check if Python dependencies are installed and FFmpeg is available'
            });
          }
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        resolve({
          success: false,
          error: 'Failed to start Python process',
          suggestion: 'Ensure Python is installed and accessible in PATH'
        });
      });

      // Set timeout (5 minutes for large files)
      setTimeout(() => {
        pythonProcess.kill('SIGTERM');
        resolve({
          success: false,
          error: 'Transcription timeout',
          suggestion: 'Try with a shorter audio file or check if the file is corrupted'
        });
      }, 300000); // 5 minutes
    });
  }

  /**
   * Clean up temporary uploaded file
   */
  private async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      console.log(`Cleaned up file: ${filePath}`);
    } catch (error) {
      console.warn(`Failed to cleanup file ${filePath}:`, error);
    }
  }

  /**
   * Get supported audio/video formats
   */
  public async getSupportedFormats(req: Request, res: Response): Promise<void> {
    const supportedFormats = {
      audio: ['.mp3', '.wav', '.m4a', '.aac'],
      video: ['.mp4', '.avi', '.mov', '.mkv', '.flv', '.webm'],
      maxFileSize: '100MB',
      maxDuration: '10 minutes'
    };

    res.status(200).json({
      success: true,
      data: supportedFormats,
      message: 'Supported formats retrieved successfully'
    } as ApiResponse);
  }
}