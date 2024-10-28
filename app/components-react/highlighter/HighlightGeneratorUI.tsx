import React, { useEffect, useState } from 'react';
import { Button, Select, Checkbox, Typography } from 'antd';
import { DownOutlined, RobotOutlined } from '@ant-design/icons';
import { IFilterOptions } from './utils';
import { IMoments } from 'services/highlighter';
import { InputEmojiSection } from './InputEmojiSection';
import { EHighlighterInputTypes } from 'services/highlighter/ai-highlighter/ai-highlighter';

const { Option } = Select;

const selectStyles = {
  width: '200px',
  backgroundColor: '#2D2D2D',
  border: '1px solid #3D3D3D',
  borderRadius: '4px',
};

const dropdownStyles = {
  backgroundColor: '#2D2D2D',
  border: '1px solid #3D3D3D',
  borderRadius: '4px',
  padding: '8px 0',
};

const checkboxContainerStyles = {
  padding: '8px 12px',
  borderBottom: '1px solid #3D3D3D',
  backgroundColor: '#2D2D2D',
};

const checkboxStyles = {
  color: '#FFFFFF',
};

const optionStyles = {
  padding: '8px 12px',
  color: '#FFFFFF',
};

export default function HighlightGeneratorUI({
  rounds,
  emitSetFilter,
}: {
  rounds: {
    round: number;
    moments: IMoments[];
  }[];
  emitSetFilter: (filter: IFilterOptions) => void;
}) {
  // console.log('reHIGHUI');

  const [selectedRounds, setSelectedRounds] = useState<number[]>([0]);
  const [filterType, setFilterType] = useState<'duration' | 'hypescore'>('duration');
  const [targetDuration, setTargetDuration] = useState(10);

  const handleRoundSelect = (value: number[]) => {
    if (value.includes(0)) {
      setSelectedRounds([0]);
    } else if (value.length === 0) {
      setSelectedRounds([0]);
    } else {
      setSelectedRounds(value.filter(item => item !== 0));
    }
  };

  useEffect(() => {
    emitSetFilter({
      rounds: selectedRounds,
      targetDuration: filterType === 'duration' ? targetDuration * 60 : 9999,
      includeAllEvents: true,
    });
    console.log('sth changed');
  }, [selectedRounds, filterType, targetDuration]);

  function highlightGeneratorUI(moments: IMoments[]) {
    const combinedKillAndKnocked = moments.reduce((count, moment) => {
      if (
        moment.type === EHighlighterInputTypes.KILL ||
        moment.type === EHighlighterInputTypes.KNOCKED
      ) {
        return count + 1;
      }
      return count;
    }, 0);
    const won = moments.some(moment => moment.type === EHighlighterInputTypes.VICTORY);

    return (
      <>
        🔫: {combinedKillAndKnocked} | {won ? <>🏆</> : <>🪦</>}
      </>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 16px',
        backgroundColor: 'rgba(45, 45, 45, 0.9)',
        borderRadius: '24px',
        width: 'fit-content',
      }}
    >
      <h3 style={{ color: '#FFFFFF', margin: 0, fontWeight: 400 }}>
        🤖 Generate highlight video of
      </h3>

      <Select
        style={selectStyles}
        mode="multiple"
        value={selectedRounds}
        onChange={handleRoundSelect}
        maxTagCount={2}
        suffixIcon={<DownOutlined style={{ color: '#FFFFFF', fontSize: '12px' }} />}
        tagRender={({ value }) => (
          <span
            style={{
              padding: '3px 8px',
              fontSize: '12px',
              backgroundColor: '#3D3D3D',
              borderRadius: '4px',
              marginRight: '4px',
              color: '#FFFFFF',
            }}
          >
            {value === 0 ? 'All Rounds' : `Round ${value}`}
          </span>
        )}
        dropdownStyle={dropdownStyles}
        dropdownRender={menu => (
          <div style={{ backgroundColor: '#2D2D2D' }}>
            <div style={checkboxContainerStyles}>
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
              {rounds.map(roundInfo => (
                <div key={roundInfo.round} style={checkboxContainerStyles}>
                  <Checkbox
                    style={checkboxStyles}
                    checked={selectedRounds.includes(roundInfo.round)}
                    onChange={e => {
                      if (e.target.checked) {
                        const newSelection = [
                          ...selectedRounds.filter(r => r !== 0),
                          roundInfo.round,
                        ];
                        setSelectedRounds(newSelection);
                      } else {
                        const newSelection = selectedRounds.filter(r => r !== roundInfo.round);
                        setSelectedRounds(newSelection.length === 0 ? [0] : newSelection);
                      }
                    }}
                  >
                    Round {roundInfo.round} <br />
                    {highlightGeneratorUI(roundInfo.moments)}
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
        style={{ ...selectStyles, width: '116px' }}
        value={targetDuration}
        onChange={value => setTargetDuration(value)}
        dropdownStyle={dropdownStyles}
      >
        <Option value={1} style={optionStyles}>
          1 minute
        </Option>
        <Option value={2} style={optionStyles}>
          2 minutes
        </Option>
        <Option value={5} style={optionStyles}>
          5 minutes
        </Option>
        <Option value={10} style={optionStyles}>
          10 minutes
        </Option>
        <Option value={15} style={optionStyles}>
          15 minutes
        </Option>
        <Option value={20} style={optionStyles}>
          20 minutes
        </Option>
        <Option value={999} style={optionStyles}>
          unlimited
        </Option>
      </Select>

      <Button
        type="text"
        onClick={() => {
          setSelectedRounds([0]);
          setFilterType('duration');
          setTargetDuration(10);
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
