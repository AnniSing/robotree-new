import { TeamMember } from '../../types/index.js';

export interface ITeamRepository {
  list(): Promise<TeamMember[]>;
  findById(id: number | string): Promise<TeamMember | null>;
  create(member: TeamMember): Promise<TeamMember>;
  update(id: number | string, updates: Partial<TeamMember>): Promise<TeamMember | null>;
  delete(id: number | string): Promise<boolean>;
}
