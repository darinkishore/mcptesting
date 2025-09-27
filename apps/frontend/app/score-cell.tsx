interface ScoreCellProps {
  score: number;
  maxScore: number;
}

export function ScoreCell({ score, maxScore }: ScoreCellProps) {
  const percentage = (score / maxScore) * 100;
  const color =
    percentage >= 90 ? 'text-green-600' :
    percentage >= 70 ? 'text-yellow-600' :
    'text-red-600';

  return (
    <div className="flex items-center">
      <span className={`text-sm font-medium ${color}`}>
        {score}/{maxScore}
      </span>
      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            percentage >= 90 ? 'bg-green-500' :
            percentage >= 70 ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}