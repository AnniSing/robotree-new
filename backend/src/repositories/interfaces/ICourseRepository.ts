import { Course } from '../../types/index.js';

export interface ICourseRepository {
  list(): Promise<Course[]>;
  findById(id: string): Promise<Course | null>;
  create(course: Course): Promise<Course>;
  update(id: string, updates: Partial<Course>): Promise<Course | null>;
  delete(id: string): Promise<boolean>;
}
