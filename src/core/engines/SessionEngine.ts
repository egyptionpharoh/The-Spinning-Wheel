import { BaseItem, SessionSettings, EvaluationOutcome, WheelPresence, ItemSnapshot, Session } from '../types/core';
import { SessionData, HistoryEvent } from '../types';
import { DataRepository } from '../repository/DataRepository';
import { UUIDGenerator } from '../providers/IdGenerator';

export class SessionEngine {
  private currentSession: SessionData | null = null;
  private repository: DataRepository;
  private idGenerator: UUIDGenerator;

  constructor(repository: DataRepository) {
    this.repository = repository;
    this.idGenerator = new UUIDGenerator();
  }

  public startSession(
    pluginIdOrSession: string | Session,
    classNameOrSettings?: string | SessionSettings,
    initialItems?: BaseItem[],
    settings?: SessionSettings
  ): SessionData {
    const isCompiledSession = typeof pluginIdOrSession === 'object';
    const actualPluginId = isCompiledSession ? pluginIdOrSession.templateId : pluginIdOrSession;
    const actualClassName = typeof classNameOrSettings === 'string' ? classNameOrSettings : '';
    const actualSettings = isCompiledSession
      ? (typeof classNameOrSettings === 'object' ? classNameOrSettings : settings!)
      : (settings || (typeof classNameOrSettings === 'object' ? classNameOrSettings : ({} as SessionSettings)));
    const actualItems = isCompiledSession ? pluginIdOrSession.activeItems : (initialItems || []);

    const session: SessionData = {
      sessionId: this.idGenerator.generate(),
      pluginId: actualPluginId,
      startTime: Date.now(),
      endTime: null,
      className: actualClassName,
      totalSpins: 0,
      settings: actualSettings,
      events: []
    };

    this.currentSession = session;
    this.repository.saveAll(actualItems);
    
    return session;
  }

  public getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  public recordEvent(
    itemId: string,
    actionTaken: EvaluationOutcome,
    previousPresence: WheelPresence,
    newPresence: WheelPresence,
    decisionDurationMs: number,
    itemSnapshot: ItemSnapshot
  ): HistoryEvent | null {
    if (!this.currentSession) return null;

    const event: HistoryEvent = {
      eventId: this.idGenerator.generate(),
      timestamp: Date.now(),
      itemId,
      pluginId: this.currentSession.pluginId,
      actionTaken,
      previousPresence,
      newPresence,
      decisionDurationMs,
      itemSnapshot
    };

    this.currentSession.events.push(event);
    return event;
  }

  public incrementSpinCount(): void {
    if (this.currentSession) {
      this.currentSession.totalSpins += 1;
    }
  }

  public endSession(): SessionData | null {
    if (!this.currentSession) return null;
    
    this.currentSession.endTime = Date.now();
    const finishedSession = this.currentSession;
    this.currentSession = null;
    
    return finishedSession;
  }
}