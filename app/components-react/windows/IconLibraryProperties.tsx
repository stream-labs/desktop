import cx from 'classnames';
import path from 'path';
import fs from 'fs';
import { ModalLayout } from '../shared/ModalLayout';
import { $t } from '../../services/i18n';
import React, { useState } from 'react';
import { Services } from '../service-provider';
import { FileInput } from '../shared/inputs';
import styles from './IconLibraryProperties.m.less';
import { TObsType } from '../../components/obs/inputs/ObsInput';

export default () => {
  // inject services
  const { SourcesService, WindowsService } = Services;

  const sourceId = WindowsService.getChildWindowQueryParams().sourceId;
  const source = SourcesService.views.getSource(sourceId);

  const [folderPath, setFolderPath] = useState('');
  const [folderImages, setFolderImages] = useState(['']);
  const [selectedIcon, setSelectedIcon] = useState('');

  const selectFolder = (folder: string) => {
    setFolderPath(folder);

    fs.readdir(folder, (err: Error, files: string[]) => {
      setFolderImages(files.map((file: string) => path.join(folder, file)));
      selectIcon(path.join(folder, files[0]));
    });
  };

  const selectIcon = (iconPath: string) => {
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
  };

  const filters = [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }];

  const PreviewImage = () => {
    if (!selectedIcon) return <div />;
    return <ImageCell path={selectedIcon} isSelected={false} large={true} handleClick={() => {}} />;
  };

  return (
    <ModalLayout fixedChild={<PreviewImage />}>
      <div>
        <FileInput onChange={selectFolder} value={folderPath} directory={true} filters={filters} />
        <div style={{ display: 'flex' }}>
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

const ImageCell = (props: IImageCellProps) => (
  <div
    className={cx(styles.imageCell, { [styles.selected]: props.isSelected })}
    onClick={() => props.handleClick(props.path)}
  >
    <img src={props.path} />
  </div>
);
