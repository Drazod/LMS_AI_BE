import { QuestionService } from '../services/QuestionService';
import { Request, Response } from 'express';
import { ContentService } from '../services/ContentService';
import { ContentType } from '../models/entities/ContentEntity';

export class ContentController {
  private questionService?: QuestionService;

  private getQuestionService(): QuestionService {
    if (!this.questionService) {
      this.questionService = new QuestionService();
    }
    return this.questionService;
  }
  private contentService?: ContentService;

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
   * Get all contents for a section
   * GET /api/sections/:sectionId/contents
   */
  getContentsBySection = async (req: Request, res: Response): Promise<void> => {
    try {
      const sectionId = parseInt(req.params.sectionId);
      
      if (!sectionId) {
        res.status(400).json({
          success: false,
          message: 'Section ID is required'
        });
        return;
      }
      const contents = await this.getContentService().getContentsBySectionId(sectionId);
      const questions = await this.getQuestionService().getQuestionsBySection(sectionId);
      res.status(200).json({
        success: true,
        data: {
          contents,
          questions
        },
        message: 'Contents and questions retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getContentsBySection:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get content by ID
   * GET /api/contents/:contentId
   */
  getContentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const contentId = parseInt(req.params.contentId);
      
      if (!contentId) {
        res.status(400).json({
          success: false,
          message: 'Content ID is required'
        });
        return;
      }

      const content = await this.getContentService().getContentById(contentId);
      
      if (!content) {
        res.status(404).json({
          success: false,
          message: 'Content not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: content,
        message: 'Content retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getContentById:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Create new content
   * POST /api/contents
   */
  createContent = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body format
      if (!this.validateRequestBody(req, res)) {
        return;
      }

      const { content, position, type, sectionId } = req.body;
      
      if (position === undefined || !type) {
        res.status(400).json({
          success: false,
          message: 'Position and type are required'
        });
        return;
      }

      const contentData = {
        content,
        position: parseInt(position),
        type: type as ContentType,
        sectionId: sectionId ? parseInt(sectionId) : undefined
      };

      const newContent = await this.getContentService().createContent(contentData);
      
      res.status(201).json({
        success: true,
        data: newContent,
        message: 'Content created successfully'
      });
    } catch (error) {
      console.error('Error in createContent:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Update content
   * PUT /api/contents/:contentId
   */
  updateContent = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body format
      if (!this.validateRequestBody(req, res)) {
        return;
      }

      const contentId = parseInt(req.params.contentId);
      const updateData = req.body;
      
      if (!contentId) {
        res.status(400).json({
          success: false,
          message: 'Content ID is required'
        });
        return;
      }

      // Convert position to number if provided
      if (updateData.position) {
        updateData.position = parseInt(updateData.position);
      }

      const content = await this.getContentService().updateContent(contentId, updateData);
      
      if (!content) {
        res.status(404).json({
          success: false,
          message: 'Content not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: content,
        message: 'Content updated successfully'
      });
    } catch (error) {
      console.error('Error in updateContent:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Delete content
   * DELETE /api/contents/:contentId
   */
  deleteContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const contentId = parseInt(req.params.contentId);
      
      if (!contentId) {
        res.status(400).json({
          success: false,
          message: 'Content ID is required'
        });
        return;
      }

      const deleted = await this.getContentService().deleteContent(contentId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Content not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Content deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteContent:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Reorder contents within a section
   * PUT /api/sections/:sectionId/contents/reorder
   */
  reorderContents = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body format
      if (!this.validateRequestBody(req, res)) {
        return;
      }

      const sectionId = parseInt(req.params.sectionId);
      const { contentIds } = req.body;
      
      if (!sectionId || !Array.isArray(contentIds)) {
        res.status(400).json({
          success: false,
          message: 'Section ID and content IDs array are required'
        });
        return;
      }

      const contents = await this.getContentService().reorderContents(
        sectionId, 
        contentIds.map(id => parseInt(id))
      );
      
      res.status(200).json({
        success: true,
        data: contents,
        message: 'Contents reordered successfully'
      });
    } catch (error) {
      console.error('Error in reorderContents:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}