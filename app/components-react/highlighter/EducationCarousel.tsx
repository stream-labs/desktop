import { Carousel } from 'antd';
import React from 'react';
import styles from './EducationCarousel.m.less';
// Add carousel styles
const carouselStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  backgroundColor: 'red',
};

const contentStyle: React.CSSProperties = {
  margin: 0,
  height: '160px',
  color: '#fff',
  lineHeight: '160px',
  textAlign: 'center',
  background: '#364d79',
};

export default function EducationCarousel() {
  return (
    <Carousel arrows={true} dots={true}>
      <div className={styles.contentWrapper}>
        <div
          style={{
            height: '100%',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'start',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              paddingLeft: '6px',
            }}
          >
            <h3 style={{ fontSize: '16px' }}> Game language must be english</h3>
            <p style={{ fontSize: '12px' }}>
              Ai Highlighter only works, if the game language is set to english. How to change the
              game language?
            </p>
          </div>
          <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
            <div className={`${styles.languageDifference} ${styles.languageCorrect}`}>English</div>

            <div className={`${styles.languageDifference} ${styles.languageFalse}`}> Spanish</div>
          </div>
        </div>
      </div>
      <div>
        <h3 style={contentStyle}>Feature 2</h3>
      </div>
      <div>
        <h3 style={contentStyle}>Feature 3</h3>
      </div>
    </Carousel>
  );
}
