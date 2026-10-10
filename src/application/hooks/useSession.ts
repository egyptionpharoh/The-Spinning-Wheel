// src/application/hooks/useSession.ts
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { stateManager } from '../../core/store/StateManager';
import { SessionSettings, BaseItem, Question } from '../../core/types/core';

export const useSession = () => {
  const navigate = useNavigate();

  const startSession = useCallback((settings: SessionSettings, initialItems: BaseItem[], questions?: Question[]) => {
    stateManager.initializeSession('default-plugin', 'Music Class', initialItems, settings, questions);
    // تم إيقاف سطر التوجيه لمنع مسح رقم القالب من الرابط
  }, [navigate]);

  const endSession = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return { startSession, endSession };
};