import { Request, Response, NextFunction } from 'express';
import { TeamService } from '../services/TeamService.js';
import { getParam } from '../utils/params.js';

export class TeamController {
  public static async listTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const team = await TeamService.listTeamMembers();
      res.json({
        success: true,
        count: team.length,
        members: team,
        team,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createTeamMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const member = await TeamService.createTeamMember(req.body, req.user?.email || 'Administrator');
      res.status(201).json({
        success: true,
        message: 'Team member added successfully.',
        member,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateTeamMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, 'id');
      const member = await TeamService.updateTeamMember(id, req.body, req.user?.email || 'Administrator');
      res.json({
        success: true,
        message: 'Team member updated successfully.',
        member,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteTeamMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, 'id');
      await TeamService.deleteTeamMember(id, req.user?.email || 'Administrator');
      res.json({
        success: true,
        message: 'Team member removed successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}
