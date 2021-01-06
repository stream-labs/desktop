import { ModalLayout } from '../shared/ModalLayout';
import { $t } from '../../services/i18n';
import React from 'react';

export default function NameFolder() {
  const error = '';

  return (
    <ModalLayout>
      <form>
        {!error && (
          <p style={{ marginBottom: '10px' }}>{$t('Please enter the name of the folder')}</p>
        )}

        {error && <p style={{ marginBottom: '10px', color: 'red' }}>{{ error }}</p>}

        <input type="text" />
      </form>
    </ModalLayout>
  );
}
