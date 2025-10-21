# Enhanced Section Creation API

## Endpoint
`POST /api/courses/:courseId/sections`

## Description
Creates a new section with optional content (text and video files) in a single API call.

## Request Format
**Content-Type:** `multipart/form-data`

### URL Parameters
- `courseId` (required): The ID of the course to create the section in

### Form Data Fields

#### Required Fields:
- `sectionName` (string): Name of the section (e.g., "Bai 5")

#### Optional Fields:
- `title` (string): Title of the section (e.g., "Chong lừa đảo")
- `description` (string): Description of the section (e.g., "Chống lừa đảo")
- `sessionType` (string): Type of session. Allowed values: "LISTEN", "WATCH", "READ", "PRACTICE"
- `position` (number): Position of the section in the course (defaults to 1 if not provided)

#### Content Fields:
- `textContents` (JSON string): Array of text content objects
  ```json
  [{"contentType":"TEXT","content":"Học tập"}]
  ```

- `videoFiles` (files): Video files to upload
- `filePositions` (JSON string): Array of positions for video files
  ```json
  [2]
  ```

## Example Request Using Your Current Format

```javascript
const formData = new FormData();

// Basic section information
formData.append('sectionName', 'Bai 5');
formData.append('title', 'Chong lừa đảo');
formData.append('description', 'Chống lừa đảo');
formData.append('sessionType', 'LISTEN');

// Text content
formData.append('textContents', JSON.stringify([
  {"contentType":"TEXT","content":"Học tập"}
]));

// Video files
formData.append('videoFiles', videoFile1);
formData.append('videoFiles', videoFile2); // If multiple files

// File positions
formData.append('filePositions', JSON.stringify([2]));

// Make the request
fetch('/api/courses/1/sections', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  },
  body: formData
});
```

## Response Format

```json
{
  "success": true,
  "data": {
    "sectionId": 1,
    "sectionName": "Bai 5",
    "title": "Chong lừa đảo",
    "description": "Chống lừa đảo",
    "sessionType": "LISTEN",
    "position": 1,
    "courseId": 1,
    "contents": [
      {
        "id": 1,
        "content": "Học tập",
        "position": 1,
        "type": "TEXT",
        "sectionId": 1
      },
      {
        "id": 2,
        "content": "https://res.cloudinary.com/dzgj7by1y/video/upload/v1760679404/qvnzqcwem9xr4gcudr1h",
        "position": 2,
        "type": "VIDEO",
        "sectionId": 1
      }
    ]
  },
  "message": "Section created successfully with content"
}
```

## Key Features

1. **Single API Call**: Create section and content in one request
2. **File Upload Support**: Automatically uploads video files to Cloudinary
3. **Multiple Content Types**: Supports both text content and video files
4. **Flexible Positioning**: Specify positions for different content types
5. **Backward Compatible**: Still supports basic section creation without content

## Error Handling

The API will:
- Create the section even if some content creation fails
- Log content creation errors without failing the entire request
- Return created content in the response

## Authentication
Requires valid JWT token in Authorization header:
```
Authorization: Bearer your-jwt-token
```

## Validation
- `courseId` and `sectionName` are required
- Video files are uploaded to Cloudinary automatically
- Text content is stored directly in the database
- Content positions are automatically assigned if not specified