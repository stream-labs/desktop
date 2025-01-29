import React, { useState } from 'react';
import { Button } from 'antd';
import FormFactory from 'components-react/shared/inputs/FormFactory';
import cx from 'classnames';
import styles from './Collaborate.m.less';
import { LANG_CODE_MAP } from 'services/i18n';
import { TagsInput, TextAreaInput, TextInput } from 'components-react/shared/inputs';
import { Services } from 'components-react/service-provider';


export default function Matchmake(p: { setPage: (val: string) => void }) {
  const { CollaborateService } = Services;

  const [streamContent, setStreamContent] = useState<string[]>(['Card Games']);
  const [streamVibes, setStreamVibes] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(['en-US']);
  const [bio, setBio] = useState('');
  const [discord, setDiscord] = useState('');

  const contentTags = [
    { value: 'tag1', label: 'MOBAs' },
    { value: 'tag2', label: 'Commentary' },
    { value: 'tag3', label: 'FPS' },
    { value: 'tag4', label: 'Arts and Crafts' },
    { value: 'tag5', label: 'RPGs' },
    { value: 'tag6', label: 'Card Games' },
    { value: 'tag7', label: 'Software Dev' },
    { value: 'tag8', label: 'Tabletop' },
    { value: 'tag9', label: 'Racing' },
    { value: 'tag10', label: 'Social Games' },
    { value: 'tag11', label: 'Music' },
    { value: 'tag12', label: 'Food and Drink' },
    { value: 'tag13', label: 'Adventure' },
    { value: 'tag14', label: 'Survival' },
    { value: 'tag15', label: 'IRL' },
  ];

  const vibeTags = [
    { value: 'tag1', label: 'Cozy Vibes' },
    { value: 'tag2', label: 'Tryharding/Sweating' },
    { value: 'tag3', label: 'rotmaxxing' },
    { value: 'tag4', label: 'VTubing' },
    { value: 'tag5', label: 'Mature Content' },
    { value: 'tag6', label: 'Wholesomeness' },
    { value: 'tag7', label: 'Banter' },
    { value: 'tag8', label: 'Memeing' },
    { value: 'tag9', label: 'Chillin' },
    { value: 'tag10', label: 'LGBTIA+' },
    { value: 'tag11', label: 'Roleplay' },
    { value: 'tag12', label: 'Plant Zaddies' },
    { value: 'tag13', label: 'Silly Guys' },
  ];

  const languageOptions = Object.values(LANG_CODE_MAP).map(opt => ({ value: opt.locale, label: opt.lang }))

  function selectContent(vals: string[]) {
    setStreamContent(vals);
  }

  function selectVibes(vals: string[]) {
    setStreamVibes(vals);
  }

  function selectLanguages(vals: string[]) {
    setLanguages(vals);
  }

  function match() {
    CollaborateService.actions.createChat('', []);
    p.setPage('Comfy Card Dads');
  }

  return (
    <div className={styles.matchmakeFormContainer}>
        <TagsInput label="I Like to Stream..." options={contentTags} onChange={selectContent} />
        <TagsInput label="My Streams are all about...." options={vibeTags} onChange={selectVibes} />
        <TextAreaInput label="Bio" placeholder="Anything else you want to add about yourself" onChange={setBio} value={bio} />
        <TagsInput label="Languages" options={languageOptions} onChange={selectLanguages} value={languages} />
        <TextInput label="Discord Username" onChange={setDiscord} value={discord} />
        <Button onClick={match}>Find Friends</Button>
    </div>
  );
}
