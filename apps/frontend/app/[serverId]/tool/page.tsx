import { ToolScore } from './tool-score';
import { ToolScoreDisplay } from './tool-score-display';
import { dataLoader } from '../../../lib/data-loader';
import { notFound } from 'next/navigation';

// Dynamic data loading from JSON files
async function getServerData(serverId: string) {
  try {
    const data = await dataLoader.getServerData(serverId);

    if (!data) {
      notFound();
    }

    return data;
  } catch (error) {
    console.error(`Error loading server ${serverId}:`, error);
    notFound();
  }
}

interface ToolPageProps {
  params: Promise<{ serverId: string }>;
}

export default async function ToolEvaluationPage({ params }: ToolPageProps) {
  const { serverId } = await params;
  const data = await getServerData(serverId);

  return (
    <div className="space-y-0">
      <ToolScoreDisplay
        taskEvaluations={data.toolEvaluation.taskEvaluations}
      />
      <ToolScore
        serverName={data.server.name}
        taskEvaluations={data.toolEvaluation.taskEvaluations}
      />
    </div>
  );
}
