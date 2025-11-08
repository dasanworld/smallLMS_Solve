import React from 'react';

interface SubmissionPolicy {
  allow_text_submission: boolean;
  allow_link_submission: boolean;
  allow_file_submission: boolean;
  max_file_size?: number;
  allowed_file_types?: string[];
}

interface AssignmentDescriptionProps {
  description: string;
  submissionPolicy: SubmissionPolicy;
}

const AssignmentDescription: React.FC<AssignmentDescriptionProps> = ({ 
  description, 
  submissionPolicy 
}) => {
  return (
    <div className="mb-8">
      <div className="prose max-w-none mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Assignment Description</h2>
        {description ? (
          <div className="text-gray-700 whitespace-pre-line">{description}</div>
        ) : (
          <p className="text-gray-500 italic">No description provided for this assignment.</p>
        )}
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Submission Policy</h3>
        <ul className="space-y-2">
          {submissionPolicy.allow_text_submission && (
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Text submission is allowed</span>
            </li>
          )}
          {submissionPolicy.allow_link_submission && (
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Link submission is allowed</span>
            </li>
          )}
          {submissionPolicy.allow_file_submission && (
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>File submission is allowed</span>
              {submissionPolicy.max_file_size && (
                <span className="ml-1">(Max file size: {(submissionPolicy.max_file_size / 1024 / 1024).toFixed(1)} MB)</span>
              )}
              {submissionPolicy.allowed_file_types && submissionPolicy.allowed_file_types.length > 0 && (
                <span className="ml-1">(Types: {submissionPolicy.allowed_file_types.join(', ')})</span>
              )}
            </li>
          )}
          {!(submissionPolicy.allow_text_submission || 
             submissionPolicy.allow_link_submission || 
             submissionPolicy.allow_file_submission) && (
            <li className="text-gray-500">No submission methods are currently allowed</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default AssignmentDescription;