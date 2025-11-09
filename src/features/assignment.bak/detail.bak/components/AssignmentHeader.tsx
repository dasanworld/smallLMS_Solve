import React from 'react';

interface AssignmentHeaderProps {
  title: string;
  deadline: string;
  scoreWeight: number;
  courseTitle: string;
}

const AssignmentHeader: React.FC<AssignmentHeaderProps> = ({ 
  title, 
  deadline, 
  scoreWeight,
  courseTitle
}) => {
  const formattedDeadline = new Date(deadline).toLocaleString();

  return (
    <div className="mb-8">
      <nav className="text-sm mb-4">
        <a href="/dashboard" className="text-blue-600 hover:underline">Dashboard</a>
        <span className="mx-2">/</span>
        <a href={`/courses`} className="text-blue-600 hover:underline">Courses</a>
        <span className="mx-2">/</span>
        <span className="text-gray-500">{courseTitle}</span>
      </nav>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
      
      <div className="flex flex-wrap gap-6 text-sm">
        <div className="flex items-center">
          <span className="text-gray-600 mr-2">Deadline:</span>
          <span className={`font-medium ${new Date(deadline) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
            {formattedDeadline}
          </span>
        </div>
        
        <div className="flex items-center">
          <span className="text-gray-600 mr-2">Score Weight:</span>
          <span className="font-medium text-gray-900">{scoreWeight}%</span>
        </div>
      </div>
    </div>
  );
};

export default AssignmentHeader;