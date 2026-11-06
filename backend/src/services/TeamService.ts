import { repositories } from '../repositories/index.js';
import { TeamMember } from '../types/index.js';
import { NotFoundError } from '../errors/AppError.js';
import { AuditService } from './AuditService.js';

export class TeamService {
  public static async listTeamMembers(): Promise<TeamMember[]> {
    return repositories.team.list();
  }

  public static async getTeamMember(id: number | string): Promise<TeamMember> {
    const member = await repositories.team.findById(id);
    if (!member) throw new NotFoundError(`Team member not found: ${id}`);
    return member;
  }

  public static async createTeamMember(member: TeamMember, actor = 'System Administrator'): Promise<TeamMember> {
    const created = await repositories.team.create(member);
    await AuditService.logAction(actor, 'TEAM_MEMBER_CREATED', 'team', `Added member: ${member.name}`, {
      resourceId: String(member.id),
    });
    return created;
  }

  public static async updateTeamMember(id: number | string, updates: Partial<TeamMember>, actor = 'System Administrator'): Promise<TeamMember> {
    const updated = await repositories.team.update(id, updates);
    if (!updated) throw new NotFoundError(`Team member not found: ${id}`);
    await AuditService.logAction(actor, 'TEAM_MEMBER_UPDATED', 'team', `Updated member: ${updated.name}`, {
      resourceId: String(id),
    });
    return updated;
  }

  public static async deleteTeamMember(id: number | string, actor = 'System Administrator'): Promise<boolean> {
    const success = await repositories.team.delete(id);
    if (!success) throw new NotFoundError(`Team member not found: ${id}`);
    await AuditService.logAction(actor, 'TEAM_MEMBER_DELETED', 'team', `Deleted member: ${id}`, {
      resourceId: String(id),
    });
    return true;
  }
}
