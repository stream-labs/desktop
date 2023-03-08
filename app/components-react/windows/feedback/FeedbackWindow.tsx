import React, { useState } from 'react';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import FeedbackForm from './FeedbackForm';
import FeedbackSuccess from './FeedbackSuccess';

export default function FeedbackWindow() {
  const [formComplete, setFormComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [canContact, setCanContact] = useState(false);

  return (
    <ModalLayout hideFooter={formComplete}>
      {formComplete ? (
        <FeedbackForm
          setFormComplete={setFormComplete}
          setScore={setScore}
          setComment={setComment}
        />
      ) : (
        <FeedbackSuccess score={score} setCanContact={setCanContact} />
      )}
    </ModalLayout>
  );
}
