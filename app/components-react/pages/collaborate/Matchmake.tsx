import React, { useState } from 'react';
import { Button } from 'antd';
import FormFactory from 'components-react/shared/inputs/FormFactory';
import cx from 'classnames';
import styles from './CommunityHub.m.less';
import { LANG_CODE_MAP } from 'services/i18n';
import { TagsInput, TextAreaInput, TextInput } from 'components-react/shared/inputs';


export default function Matchmake() {
  const [streamContent, setStreamContent] = useState<string[]>([]);
  const [streamVibes, setStreamVibes] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [discord, setDiscord] = useState('');

  const contentTags = [
    { value: 'tag1', label: 'MOBAs' },
    { value: 'tag2', label: 'IRL/Commentary' },
    { value: 'tag3', label: 'FPS' },
    { value: 'tag4', label: 'Arts and Crafts' },
    { value: 'tag5', label: 'RPGs' },
  ];

  const vibeTags = [
    { value: 'tag1', label: 'Comfy Vibes' },
    { value: 'tag2', label: 'Competitive Gameplay' },
    { value: 'tag3', label: 'rotmaxxing' },
    { value: 'tag4', label: 'VTubing' },
    { value: 'tag5', label: 'Mature Content' },
    { value: 'tag6', label: 'Family Friendly' },
    { value: 'tag7', label: 'Banter' },
    { value: 'tag8', label: 'Production Value' },
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

  return (
    <div>
        <TagsInput label="I Like to Stream..." options={contentTags} onChange={selectContent} required />
        <TagsInput label="My Streams are all about...." options={vibeTags} onChange={selectVibes} required />
        <TextAreaInput label="Bio" placeholder="Anything else you want to add about yourself" onChange={setBio} value={bio} />
        <TagsInput label="Languages" options={languageOptions} onChange={selectLanguages} value={languages} />
        <TextInput label="Discord Username" onChange={setDiscord} value={discord} />
        <Button>Find Friends</Button>
    </div>
  );
}
