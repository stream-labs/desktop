import { OnboardingStepContext } from '../onboarding';

export enum StreamerKnowledgeMode {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export const isBeginnerOrIntermediateOrUnselected = ({
  streamerKnowledgeMode,
}: OnboardingStepContext) =>
  !streamerKnowledgeMode ||
  [StreamerKnowledgeMode.BEGINNER, StreamerKnowledgeMode.INTERMEDIATE].includes(
    streamerKnowledgeMode,
  );

export const isIntermediateOrAdvancedOrUnselected = ({
  streamerKnowledgeMode,
}: OnboardingStepContext) =>
  !streamerKnowledgeMode ||
  [StreamerKnowledgeMode.INTERMEDIATE, StreamerKnowledgeMode.ADVANCED].includes(
    streamerKnowledgeMode,
  );
