import { getRepository, Repository } from 'typeorm';
import { ContentEntity, ContentType } from '../models/entities/ContentEntity';
import { ContentDetailResponse } from '../models/response';

export class ContentService {
  private contentRepository?: Repository<ContentEntity>;

  private getContentRepository(): Repository<ContentEntity> {
    if (!this.contentRepository) {
      this.contentRepository = getRepository(ContentEntity);
    }
    return this.contentRepository;
  }

  /**
   * Get all contents for a section
   */
  async getContentsBySectionId(sectionId: number): Promise<ContentDetailResponse[]> {
    try {
      const contents = await this.getContentRepository().find({
        where: { sectionId },
        order: { position: 'ASC' }
      });

      return contents.map(content => ({
        id: content.id,
        content: content.content,
        position: content.position,
        type: content.type,
        sectionId: content.sectionId
      }));
    } catch (error) {
      console.error('Error fetching contents for section:', error);
      throw new Error('Failed to fetch contents');
    }
  }

  /**
   * Get content by ID
   */
  async getContentById(contentId: number): Promise<ContentDetailResponse | null> {
    try {
      const content = await this.getContentRepository().findOne({
        where: { id: contentId }
      });

      if (!content) {
        return null;
      }

      return {
        id: content.id,
        content: content.content,
        position: content.position,
        type: content.type,
        sectionId: content.sectionId
      };
    } catch (error) {
      console.error('Error fetching content by ID:', error);
      throw new Error('Failed to fetch content');
    }
  }

  /**
   * Create new content
   */
  async createContent(contentData: {
    content?: string;
    position: number;
    type: ContentType;
    sectionId?: number;
  }): Promise<ContentDetailResponse> {
    try {
      // Get the next available ID manually to avoid sequence conflicts
      const maxIdResult = await this.getContentRepository()
        .createQueryBuilder('content')
        .select('COALESCE(MAX(content.id), 0) + 1', 'nextId')
        .getRawOne();
      
      console.log('=== DEBUG: ID Generation ===');
      console.log('maxIdResult:', JSON.stringify(maxIdResult, null, 2));
      
      const nextId = parseInt(maxIdResult.nextId);
      console.log('Calculated nextId:', nextId);
      
      // Use raw query to insert with specific ID to bypass TypeORM auto-generation
      const insertResult = await this.getContentRepository()
        .createQueryBuilder()
        .insert()
        .into(ContentEntity)
        .values({
          id: nextId,
          content: contentData.content,
          position: contentData.position,
          type: contentData.type,
          sectionId: contentData.sectionId
        })
        .returning('*')
        .execute();
      
      const savedContent = insertResult.generatedMaps[0] as ContentEntity;
      console.log('Content inserted with ID:', savedContent.id);
      console.log('=== END DEBUG ===');

      return {
        id: savedContent.id,
        content: savedContent.content,
        position: savedContent.position,
        type: savedContent.type,
        sectionId: savedContent.sectionId
      };
    } catch (error) {
      console.error('Error creating content:', error);
      throw new Error('Failed to create content');
    }
  }

  /**
   * Update content
   */
  async updateContent(contentId: number, updateData: Partial<{
    content: string;
    position: number;
    type: ContentType;
  }>): Promise<ContentDetailResponse | null> {
    try {
      await this.getContentRepository().update(contentId, updateData);
      return this.getContentById(contentId);
    } catch (error) {
      console.error('Error updating content:', error);
      throw new Error('Failed to update content');
    }
  }

  /**
   * Delete content
   */
  async deleteContent(contentId: number): Promise<boolean> {
    try {
      const result = await this.getContentRepository().delete(contentId);
      return result.affected ? result.affected > 0 : false;
    } catch (error) {
      console.error('Error deleting content:', error);
      throw new Error('Failed to delete content');
    }
  }

  /**
   * Reorder contents within a section
   */
  async reorderContents(sectionId: number, contentIds: number[]): Promise<ContentDetailResponse[]> {
    try {
      // Update positions for each content
      const updatePromises = contentIds.map((contentId, index) =>
        this.getContentRepository().update(
          { id: contentId, sectionId },
          { position: index + 1 }
        )
      );

      await Promise.all(updatePromises);

      // Return updated contents
      return this.getContentsBySectionId(sectionId);
    } catch (error) {
      console.error('Error reordering contents:', error);
      throw new Error('Failed to reorder contents');
    }
  }
}