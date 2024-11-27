import React, { useEffect, useRef, useState } from 'react';
import { Button, Select, Checkbox, Typography } from 'antd';
import { DownOutlined, RobotOutlined } from '@ant-design/icons';
import { IFilterOptions } from './utils';
import { IInput } from 'services/highlighter';
import { getPlacementFromInputs, InputEmojiSection } from './InputEmojiSection';
import { EHighlighterInputTypes } from 'services/highlighter/ai-highlighter/ai-highlighter';
import styles from './HighlightGeneratorUI.m.less';
import { formatSecondsToHMS } from './ClipPreview';
const { Option } = Select;

const selectStyles = {
  width: '220px',
  borderRadius: '4px',
};

const dropdownStyles = {
  borderRadius: '10px',
  padding: '4px 4px',
};

const checkboxStyles = {
  width: '100%',
};

export default function HighlightGeneratorUI({
  combinedClipsDuration,
  roundDetails,
  emitSetFilter,
}: {
  combinedClipsDuration: number; // Maximum duration the highligh reel can be long - only used to restrict the targetDuration options
  roundDetails: {
    round: number;
    inputs: IInput[];
    duration: number;
    hypeScore: number;
  }[];
  emitSetFilter: (filter: IFilterOptions) => void;
}) {
  // console.log('reHIGHUI');

  const [selectedRounds, setSelectedRounds] = useState<number[]>([0]);
  const [filterType, setFilterType] = useState<'duration' | 'hypescore'>('duration');
  const [targetDuration, setTargetDuration] = useState(999);
  const options = [
    { value: 1, label: '1 minute' },
    { value: 2, label: '2 minutes' },
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 12, label: '12 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 20, label: '20 minutes' },
    { value: 30, label: '30 minutes' },
  ];
  const filteredOptions = options.filter(option => option.value * 60 <= combinedClipsDuration);
  const handleRoundSelect = (value: number[]) => {
    if (value.includes(0)) {
      setSelectedRounds([0]);
    } else if (value.length === 0) {
      setSelectedRounds([0]);
    } else {
      setSelectedRounds(value.filter(item => item !== 0));
    }
  };
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    emitSetFilter({
      rounds: selectedRounds,
      targetDuration: filterType === 'duration' ? targetDuration * 60 : 9999,
      includeAllEvents: true,
    });
    console.log('sth changed');
  }, [selectedRounds, filterType, targetDuration]);

  function roundDropdownDetails(roundDetails: {
    round: number;
    inputs: IInput[];
    duration: number;
    hypeScore: number;
  }) {
    const combinedKillAndKnocked = roundDetails.inputs.reduce((count, input) => {
      if (
        input.type === EHighlighterInputTypes.KILL ||
        input.type === EHighlighterInputTypes.KNOCKED
      ) {
        return count + 1;
      }
      return count;
    }, 0);
    const won = roundDetails.inputs.some(input => input.type === EHighlighterInputTypes.VICTORY);
    let rank = null;
    if (!won) {
      rank = getPlacementFromInputs(roundDetails.inputs);
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontWeight: 'bold' }}>Round {roundDetails.round} </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          <div className={styles.infoTag}>{combinedKillAndKnocked} 🔫</div>
          {won ? (
            <div className={styles.infoTag}>1st 🏆</div>
          ) : (
            <div className={styles.infoTag}>{`${rank ? '#' + rank : ''} 🪦`}</div>
          )}
          <div className={styles.infoTag}>{`${roundDetails.hypeScore} 🔥`}</div>
          <div className={styles.infoTag}>{`${formatSecondsToHMS(roundDetails.duration)}`}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <h3 style={{ color: '#FFFFFF', margin: 0, fontWeight: 400 }}>🤖 Create highlight video of</h3>
      <Select
        style={selectStyles}
        mode="multiple"
        value={selectedRounds}
        onChange={handleRoundSelect}
        maxTagCount={2}
        suffixIcon={<DownOutlined style={{ color: '#FFFFFF', fontSize: '12px' }} />}
        tagRender={({ value }) => (
          <span className={styles.tag}>{value === 0 ? 'All Rounds' : `Round ${value}`}</span>
        )}
        dropdownStyle={dropdownStyles}
        dropdownRender={menu => (
          <div>
            <div className={styles.option}>
              <Checkbox
                style={checkboxStyles}
                checked={selectedRounds.includes(0)}
                onChange={e => {
                  setSelectedRounds(e.target.checked ? [0] : []);
                }}
              >
                All Rounds
              </Checkbox>
            </div>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {roundDetails.map(roundDetails => (
                <div key={roundDetails.round} className={styles.option}>
                  <Checkbox
                    style={checkboxStyles}
                    checked={selectedRounds.includes(roundDetails.round)}
                    onChange={e => {
                      if (e.target.checked) {
                        const newSelection = [
                          ...selectedRounds.filter(r => r !== 0),
                          roundDetails.round,
                        ];
                        setSelectedRounds(newSelection);
                      } else {
                        const newSelection = selectedRounds.filter(r => r !== roundDetails.round);
                        setSelectedRounds(newSelection.length === 0 ? [0] : newSelection);
                      }
                    }}
                  >
                    {roundDropdownDetails(roundDetails)}
                  </Checkbox>
                </div>
              ))}
            </div>
          </div>
        )}
      />
      <h3 style={{ color: '#FFFFFF', margin: 0, fontWeight: 400 }}>with a duration of</h3>
      {/* <Select
        style={selectStyles}
        value={filterType}
        onChange={(value: 'duration' | 'hypescore') => setFilterType(value)}
        dropdownStyle={dropdownStyles}
      >
        <Option value="duration" style={optionStyles}>
          Duration
        </Option>
        <Option value="hypescore" style={optionStyles}>
          Hype Score
        </Option>
      </Select> */}
      {/* <h3 style={{ color: '#FFFFFF' }}>of</h3> */}
      <Select
        style={{ width: '116px' }}
        value={targetDuration}
        onChange={value => setTargetDuration(value)}
        dropdownStyle={dropdownStyles}
      >
        {filteredOptions.map(option => (
          <Option key={option.value} value={option.value} className={styles.option}>
            {option.label}
          </Option>
        ))}
        <Option value={999} className={styles.option}>
          unlimited
        </Option>
      </Select>
      <Button
        type="text"
        onClick={() => {
          setSelectedRounds([0]);
          setFilterType('duration');
          setTargetDuration(999);
        }}
        icon={<span style={{ color: '#666666', fontSize: '20px' }}>&times;</span>}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '16px',
          padding: 0,
        }}
      />
    </div>
  );
}
