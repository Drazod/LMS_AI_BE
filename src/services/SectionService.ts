import { getRepository, Repository, getConnection } from 'typeorm';
import { SectionEntity, SessionType } from '../models/entities/SectionEntity';
import { ContentEntity } from '../models/entities/ContentEntity';
import { SectionDetailResponse, ContentDetailResponse } from '../models/response';

export class SectionService {
  private sectionRepository?: Repository<SectionEntity>;
  private contentRepository?: Repository<ContentEntity>;

  private getSectionRepository(): Repository<SectionEntity> {
    if (!this.sectionRepository) {
      this.sectionRepository = getRepository(SectionEntity);
    }
    return this.sectionRepository;
  }

  private getContentRepository(): Repository<ContentEntity> {
    if (!this.contentRepository) {
      this.contentRepository = getRepository(ContentEntity);
    }
    return this.contentRepository;
  }

  /**
   * Get all sections for a course
   */
  async getSectionsByCourseId(courseId: number): Promise<SectionDetailResponse[]> {
    try {
      const sections = await this.getSectionRepository().find({
        where: { courseId },
        order: { position: 'ASC' }
      });

      const sectionsWithContent = await Promise.all(
        sections.map(async (section) => {
          const contents = await this.getContentRepository().find({
            where: { sectionId: section.sectionId },
            order: { position: 'ASC' }
          });

          return {
            sectionId: section.sectionId,
            sectionName: section.sectionName,
            description: section.description,
            position: section.position,
            sessionType: section.sessionType,
            title: section.title,
            courseId: section.courseId,
            contents: contents.map(content => ({
              id: content.id,
              content: content.content,
              position: content.position,
              type: content.type,
              sectionId: content.sectionId
            }))
          };
        })
      );

      return sectionsWithContent;
    } catch (error) {
      console.error('Error fetching sections for course:', error);
      throw new Error('Failed to fetch sections');
    }
  }

  /**
   * Get section by ID with contents
   */
  async getSectionById(sectionId: number): Promise<SectionDetailResponse | null> {
    try {
      const section = await this.getSectionRepository().findOne({
        where: { sectionId }
      });

      if (!section) {
        return null;
      }

      const contents = await this.getContentRepository().find({
        where: { sectionId: section.sectionId },
        order: { position: 'ASC' }
      });

      return {
        sectionId: section.sectionId,
        sectionName: section.sectionName,
        description: section.description,
        position: section.position,
        sessionType: section.sessionType,
        title: section.title,
        courseId: section.courseId,
        contents: contents.map(content => ({
          id: content.id,
          content: content.content,
          position: content.position,
          type: content.type,
          sectionId: content.sectionId
        }))
      };
    } catch (error) {
      console.error('Error fetching section by ID:', error);
      throw new Error('Failed to fetch section');
    }
  }

  /**
   * Create a new section
   */
  async createSection(sectionData: {
    sectionName: string;
    description?: string;
    position: number;
    sessionType?: SessionType;
    title?: string;
    courseId?: number;
  }): Promise<SectionDetailResponse> {
    try {
      // Use raw SQL to handle ID generation properly
      const connection = getConnection();
      
      // Get next section_id
      const maxIdResult = await connection.query(
        'SELECT COALESCE(MAX(section_id), 0) + 1 as next_id FROM section'
      );
      const nextSectionId = maxIdResult[0].next_id;

      const result = await connection.query(`
        INSERT INTO section (
          section_id, section_name, description, position, 
          session_type, title, course_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        nextSectionId,
        sectionData.sectionName,
        sectionData.description || null,
        nextSectionId, // Set position equal to section_id
        sectionData.sessionType || null,
        sectionData.title || null,
        sectionData.courseId || null
      ]);

      if (result.length === 0) {
        throw new Error('Failed to create section');
      }

      const savedSection = result[0];
      
      return {
        sectionId: savedSection.section_id,
        sectionName: savedSection.section_name,
        description: savedSection.description,
        position: savedSection.position,
        sessionType: savedSection.session_type,
        title: savedSection.title,
        courseId: savedSection.course_id,
        contents: []
      };
    } catch (error) {
      console.error('Error creating section:', error);
      throw new Error('Failed to create section');
    }
  }

  /**
   * Update section
   */
  async updateSection(sectionId: number, updateData: Partial<{
    sectionName: string;
    description: string;
    position: number;
    sessionType: SessionType;
    title: string;
  }>): Promise<SectionDetailResponse | null> {
    try {
      await this.getSectionRepository().update(sectionId, updateData);
      return this.getSectionById(sectionId);
    } catch (error) {
      console.error('Error updating section:', error);
      throw new Error('Failed to update section');
    }
  }

  /**
   * Delete section
   */
  async deleteSection(sectionId: number): Promise<boolean> {
    try {
      // First delete all contents in this section
      await this.getContentRepository().delete({ sectionId });
      
      // Then delete the section
      const result = await this.getSectionRepository().delete(sectionId);
      return result.affected ? result.affected > 0 : false;
    } catch (error) {
      console.error('Error deleting section:', error);
      throw new Error('Failed to delete section');
    }
  }
}