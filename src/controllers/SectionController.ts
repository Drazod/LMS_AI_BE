import { Request, Response } from 'express';
import { SectionService } from '../services/SectionService';
import { ContentService } from '../services/ContentService';
import { SessionType } from '../models/entities/SectionEntity';
import { ContentType } from '../models/entities/ContentEntity';

export class SectionController {
  private sectionService?: SectionService;
  private contentService?: ContentService;

  private getSectionService(): SectionService {
    if (!this.sectionService) {
      this.sectionService = new SectionService();
    }
    return this.sectionService;
  }

  private getContentService(): ContentService {
    if (!this.contentService) {
      this.contentService = new ContentService();
    }
    return this.contentService;
  }

  /**
   * Validate that request body is a valid object and not null/undefined
   */
  private validateRequestBody(req: Request, res: Response): boolean {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        message: 'Request body must be a valid JSON object'
      });
      return false;
    }
    return true;
  }

  /**
   * Get all sections for a course
   * GET /api/courses/:courseId/sections
   */
  getSectionsByCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = parseInt(req.params.courseId);
      
      if (!courseId) {
        res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
        return;
      }

      const sections = await this.getSectionService().getSectionsByCourseId(courseId);
      
      res.status(200).json({
        success: true,
        data: sections,
        message: 'Sections retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getSectionsByCourse:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get section by ID with contents
   * GET /api/sections/:sectionId
   */
  getSectionById = async (req: Request, res: Response): Promise<void> => {
    try {
      const sectionId = parseInt(req.params.sectionId);
      
      if (!sectionId) {
        res.status(400).json({
          success: false,
          message: 'Section ID is required'
        });
        return;
      }

      const section = await this.getSectionService().getSectionById(sectionId);
      
      if (!section) {
        res.status(404).json({
          success: false,
          message: 'Section not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: section,
        message: 'Section retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getSectionById:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Create new section with optional content
   * POST /api/courses/:courseId/sections
   */
  createSection = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body format
      if (!this.validateRequestBody(req, res)) {
        return;
      }

      const courseId = parseInt(req.params.courseId);
      let { 
        sectionName, 
        description, 
        position, 
        sessionType, 
        title,
        textContents,
        filePositions
      } = req.body;
      
      // Parse textContents if it's a string
      if (typeof textContents === 'string') {
        try {
          textContents = JSON.parse(textContents);
        } catch (error) {
          console.error('Error parsing textContents:', error);
          textContents = [];
        }
      }
      
      if (!courseId || !sectionName) {
        res.status(400).json({
          success: false,
          message: 'Course ID and section name are required'
        });
        return;
      }

      // Create section data
      const sectionData = {
        sectionName,
        description,
        position: 1, // This will be overridden to section_id in the service
        sessionType: sessionType as SessionType,
        title,
        courseId
      };

      // Create the section first
      const section = await this.getSectionService().createSection(sectionData);
      
      // Handle content creation if provided
      const createdContents: any[] = [];
      
      console.log('=== DEBUG: Content creation process ===');
      console.log('textContents received:', JSON.stringify(textContents, null, 2));
      console.log('textContents is array:', Array.isArray(textContents));
      console.log('Section ID created:', section.sectionId);
      
      // Handle text contents
      if (textContents && Array.isArray(textContents)) {
        console.log(`Processing ${textContents.length} text contents`);
        for (let i = 0; i < textContents.length; i++) {
          const textContent = textContents[i];
          console.log(`Processing content ${i}:`, JSON.stringify(textContent, null, 2));
          console.log(`Has content: ${!!textContent.content}`);
          console.log(`Has contentType: ${!!textContent.contentType}`);
          
          if (textContent.content && textContent.contentType) {
            try {
              const contentData = {
                content: textContent.content,
                position: i + 1,
                type: textContent.contentType as ContentType,
                sectionId: section.sectionId
              };
              console.log('Creating content with data:', JSON.stringify(contentData, null, 2));
              const newContent = await this.getContentService().createContent(contentData);
              console.log('Content created successfully:', JSON.stringify(newContent, null, 2));
              createdContents.push(newContent);
            } catch (error) {
              console.error(`Error creating text content ${i}:`, error);
              // Continue with other content, don't fail the entire request
            }
          } else {
            console.log(`Skipping content ${i} - missing content or contentType`);
          }
        }
      } else {
        console.log('No textContents provided or not an array');
      }
      
      console.log(`Total contents created: ${createdContents.length}`);
      console.log('=== END DEBUG ===');

      // Handle video files if uploaded
      if ((req as any).cloudinaryUrls && Array.isArray((req as any).cloudinaryUrls)) {
        const videoUrls = (req as any).cloudinaryUrls;
        const positions = filePositions && Array.isArray(filePositions) ? filePositions : [];
        
        for (let i = 0; i < videoUrls.length; i++) {
          try {
            const contentData = {
              content: videoUrls[i], // URL from Cloudinary
              position: positions[i] || (createdContents.length + i + 1),
              type: 'VIDEO' as ContentType,
              sectionId: section.sectionId
            };
            const newContent = await this.getContentService().createContent(contentData);
            createdContents.push(newContent);
          } catch (error) {
            console.error(`Error creating video content ${i}:`, error);
            // Continue with other content, don't fail the entire request
          }
        }
      }

      // Return section with created contents
      const response = {
        ...section,
        contents: createdContents
      };
      
      res.status(201).json({
        success: true,
        data: response,
        message: 'Section created successfully with content'
      });
    } catch (error) {
      console.error('Error in createSection:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Update section
   * PUT /api/sections/:sectionId
   */
  updateSection = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body format
      if (!this.validateRequestBody(req, res)) {
        return;
      }

      const sectionId = parseInt(req.params.sectionId);
      const updateData = req.body;
      
      if (!sectionId) {
        res.status(400).json({
          success: false,
          message: 'Section ID is required'
        });
        return;
      }

      const section = await this.getSectionService().updateSection(sectionId, updateData);
      
      if (!section) {
        res.status(404).json({
          success: false,
          message: 'Section not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: section,
        message: 'Section updated successfully'
      });
    } catch (error) {
      console.error('Error in updateSection:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Delete section
   * DELETE /api/sections/:sectionId
   */
  deleteSection = async (req: Request, res: Response): Promise<void> => {
    try {
      const sectionId = parseInt(req.params.sectionId);
      
      if (!sectionId) {
        res.status(400).json({
          success: false,
          message: 'Section ID is required'
        });
        return;
      }

      const deleted = await this.getSectionService().deleteSection(sectionId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Section not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Section deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteSection:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Add content to section
   * POST /api/sections/:sectionId/contents
   */
  addContent = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body format
      if (!this.validateRequestBody(req, res)) {
        return;
      }

      const sectionId = parseInt(req.params.sectionId);
      const { content, position, type } = req.body;
      
      if (!sectionId || position === undefined || !type) {
        res.status(400).json({
          success: false,
          message: 'Section ID, position, and type are required'
        });
        return;
      }

      const contentData = {
        content,
        position: parseInt(position),
        type: type as ContentType,
        sectionId
      };

      const newContent = await this.getContentService().createContent(contentData);
      
      res.status(201).json({
        success: true,
        data: newContent,
        message: 'Content added successfully'
      });
    } catch (error) {
      console.error('Error in addContent:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}