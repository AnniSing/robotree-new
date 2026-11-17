import { repositories } from '../repositories/index.js';
import { TeamMember } from '../types/index.js';
import { NotFoundError } from '../errors/AppError.js';
import { AuditService } from './AuditService.js';
import { SyncService } from './SyncService.js';

export class TeamService {
  public static async listTeamMembers(): Promise<TeamMember[]> {
    return repositories.team.list();
  }

  public static async getTeamMember(id: number | string): Promise<TeamMember> {
    const member = await repositories.team.findById(id);
    if (!member) throw new NotFoundError(`Team member not found: ${id}`);
    return member;
  }

  public static async createTeamMember(member: TeamMember, actor = 'System Administrator', ip = '127.0.0.1'): Promise<TeamMember> {
    const created = await repositories.team.create(member);
    SyncService.broadcast('team', 'CREATE', String(created.id));
    await repositories.history.record('team', String(created.id), 'CREATE', null, created, actor, ip);
    await AuditService.logAction(actor, 'TEAM_MEMBER_CREATED', 'team', `Added member: ${member.name} from IP ${ip}`, {
      resourceId: String(member.id),
      ip,
    });
    return created;
  }

  public static async updateTeamMember(id: number | string, updates: Partial<TeamMember>, actor = 'System Administrator', ip = '127.0.0.1'): Promise<TeamMember> {
    const prev = await repositories.team.findById(id);
    const updated = await repositories.team.update(id, updates);
    if (!updated) throw new NotFoundError(`Team member not found: ${id}`);
    SyncService.broadcast('team', 'UPDATE', String(id));
    await repositories.history.record('team', String(id), 'UPDATE', prev, updated, actor, ip);
    await AuditService.logAction(actor, 'TEAM_MEMBER_UPDATED', 'team', `Updated member: ${updated.name} from IP ${ip}`, {
      resourceId: String(id),
      ip,
    });
    return updated;
  }

  public static async deleteTeamMember(id: number | string, actor = 'System Administrator', ip = '127.0.0.1'): Promise<boolean> {
    const prev = await repositories.team.findById(id);
    const success = await repositories.team.delete(id);
    if (!success) throw new NotFoundError(`Team member not found: ${id}`);
    SyncService.broadcast('team', 'DELETE', String(id));
    await repositories.history.record('team', String(id), 'DELETE', prev, null, actor, ip);
    await AuditService.logAction(actor, 'TEAM_MEMBER_DELETED', 'team', `Deleted member: ${id} from IP ${ip}`, {
      resourceId: String(id),
      ip,
    });
    return true;
  }
}
