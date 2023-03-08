import React, { useState } from 'react';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import FeedbackForm from './FeedbackForm';
import FeedbackSuccess from './FeedbackSuccess';

export default function FeedbackWindow() {
  const [formComplete, setFormComplete] = useState(false);
  const [score, setScore] = useState(-1);
  const [comment, setComment] = useState('');
  const [canContact, setCanContact] = useState(false);

  return (
    <ModalLayout hideFooter={formComplete} onOk={() => setFormComplete(true)}>
      {formComplete ? (
        <FeedbackForm setScore={setScore} setComment={setComment} score={score} comment={comment} />
      ) : (
        <FeedbackSuccess score={score} setCanContact={setCanContact} />
      )}
    </ModalLayout>
  );
}
