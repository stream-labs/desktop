import cx from 'classnames';
import path from 'path';
import fs from 'fs';
import { ModalLayout } from '../shared/ModalLayout';
import { $t } from '../../services/i18n';
import React, { useEffect, useState } from 'react';
import { Services } from '../service-provider';
import { FileInput } from '../shared/inputs';
import styles from './IconLibraryProperties.m.less';
import { TObsType, IObsPathInputValue } from '../../components/obs/inputs/ObsInput';

export default () => {
  // inject services
  const { SourcesService, WindowsService } = Services;

  const sourceId = WindowsService.getChildWindowQueryParams().sourceId;
  const source = SourcesService.views.getSource(sourceId);

  const [folderPath, setFolderPath] = useState('');
  const [folderImages, setFolderImages] = useState(['']);
  const [selectedIcon, setSelectedIcon] = useState('');

  useEffect(lifecycle, []);

  function lifecycle() {
    if (source) {
      const settings = source.getPropertiesManagerSettings();
      if (settings.folder) {
        if (!settings.activeIcon) return selectFolder(settings.folder);
        const { folder, activeIcon } = settings;
        setFolderPath(folder);

        fs.readdir(folder, (err: Error, files: string[]) => {
          setFolderImages(files.map((file: string) => path.join(folder, file)));
        });

        setSelectedIcon(activeIcon);
      }
    }
  }

  function selectFolder(folder: string) {
    setFolderPath(folder);

    fs.readdir(folder, (err: Error, files: string[]) => {
      setFolderImages(files.map((file: string) => path.join(folder, file)));
      const activeIconPath = path.join(folder, files[0]);
      selectIcon(activeIconPath);
      if (source) {
        source.setPropertiesManagerSettings({
          folder,
          activeIcon: activeIconPath,
        });
      }
    });
  }

  function selectIcon(iconPath: string) {
    if (!source) return;
    setSelectedIcon(iconPath);
    source.setPropertiesFormData([
      {
        description: 'Image File',
        name: 'file',
        type: 'OBS_PROPERTY_FILE' as TObsType,
        value: iconPath,
        visible: true,
      },
    ]);
  }

  const filters = [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }];

  function PreviewImage() {
    if (!selectedIcon) return <div />;
    return <ImageCell path={selectedIcon} isSelected={false} large={true} handleClick={() => {}} />;
  }

  return (
    <ModalLayout fixedChild={<PreviewImage />} onOk={() => WindowsService.closeChildWindow()}>
      <div>
        <FileInput onChange={selectFolder} value={folderPath} directory={true} filters={filters} />
        <div className={styles.cellContainer}>
          {folderImages.map(image => (
            <ImageCell
              path={image}
              isSelected={image === selectedIcon}
              handleClick={selectIcon}
              key={image}
            />
          ))}
        </div>
      </div>
    </ModalLayout>
  );
};

interface IImageCellProps {
  path: string;
  isSelected: boolean;
  handleClick: Function;
  large?: boolean;
}

const ImageCell = (p: IImageCellProps) => (
  <div
    className={cx(styles.imageCell, {
      [styles.selected]: p.isSelected,
      [styles.large]: p.large,
    })}
    onClick={() => p.handleClick(p.path)}
  >
    <img src={p.path} />
  </div>
);
