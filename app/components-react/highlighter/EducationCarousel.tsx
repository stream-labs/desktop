import { Carousel } from 'antd';
import React from 'react';
import styles from './EducationCarousel.m.less';

export default function EducationCarousel() {
  return (
    <Carousel arrows={true} dots={true}>
      <div className={styles.slideWrapper}>
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
              <h3 style={{ fontSize: '16px' }}> Game language must be English</h3>
              <p style={{ fontSize: '12px' }}>
                Ai Highlighter only works, if the game language is set to english. How to change the
                game language?
              </p>
            </div>
            <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
              <div className={`${styles.languageDifference} ${styles.languageCorrect}`}>
                English
                <div style={{ position: 'absolute', top: '-16px', left: '0px' }}>
                  <CorrectThumb />
                </div>
              </div>

              <div className={`${styles.languageDifference} ${styles.languageFalse}`}>
                {' '}
                <div style={{ position: 'absolute', top: '-16px', left: '0px' }}>
                  <FalseThumb />
                </div>
                Spanish
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.slideWrapper}>
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
              <h3 style={{ fontSize: '16px' }}> Supported game modes</h3>
              <p style={{ fontSize: '12px' }}>
                Right now we are only supporting the following game modes: Battle Royale, Zero
                build, OG, Reload
              </p>
            </div>
            <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
              <div className={styles.gameModeImageWrapper}>
                <img
                  src="https://cdn2.unrealengine.com/fnbr-34-00-c6s2-discover-playlist-tiles-keyart-480x270-480x270-8e098cc63e70.jpg"
                  alt=""
                  className={styles.gameModeImage}
                />
              </div>
              <div className={styles.gameModeImageWrapper}>
                <img
                  src="https://cdn2.unrealengine.com/en-fnbr-34-00-c6s2-discover-playlist-tiles-lineup-zb-480x270-480x270-48438900e15d.jpg"
                  alt=""
                  className={styles.gameModeImage}
                />
              </div>
              <div className={styles.gameModeImageWrapper}>
                <img
                  src="https://cdn2.unrealengine.com/en-fn33-00-c1s1-discover-playlist-tiles-og-480x270-480x270-a40f03430d45.jpg"
                  alt=""
                  className={styles.gameModeImage}
                />
              </div>
              <div className={styles.gameModeImageWrapper}>
                <img
                  src="https://cdn2.unrealengine.com/de-fnbr-32-00-reload-discoverytile-1920x1080-1920x1080-fdefe179ef23.jpg?resize=1&w=2560"
                  alt=""
                  className={styles.gameModeImage}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.slideWrapper}>
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
              <h3 style={{ fontSize: '16px' }}>Game & map visibility</h3>
              <p style={{ fontSize: '12px', margin: 0 }}>Map: Fully visible, Game: Fullscreen</p>
            </div>
            <div
              style={{
                display: 'flex',
                width: '100%',
                gap: '8px',
                justifyContent: 'space-between',
              }}
            >
              <div className={`${styles.overlayRuleImageWrapper} ${styles.languageCorrect}`}>
                <div style={{ position: 'absolute', top: '0', left: '0' }}>
                  <CorrectThumb />
                </div>
                <img
                  src="https://media.cleanshot.cloud/media/14014/H0eg7miTPGXRgGnC4rQlfIQhkxrWwMSdIDxKjwN2.jpeg?Expires=1740507652&Signature=pmSrOcBzg9XOTfZna9Zd-I7b1l6elC3fYNXmt5P0baOQcnE0dRle1Kcjn5-QwDa0gkMXGgJv1uwx1BwA3wLbPlUoMDNJe9KFGKjO~AiV~sq1v2jKBHXXq6WK~iXZnDFZjGPyO~ruSjOxU9M89NNjlz3W9kMz~CrgwAG3awK52c1~drTxvZTxI~ER3a1wNaXn5MRTduiOx-4jJ4TEOX~SMZ3okAfVsq9Kn5UImzjXwceEjjd9FdtcPWSMI7l1Lt0Irf3agAd6bqttLT23~JGWngJFdmhupnsDWDIKFEXMM8ei~CFzaOdLiB2IXKQMkYd044d9PuKM8Ookg6p~yTWjJg__&Key-Pair-Id=K269JMAT9ZF4GZ"
                  alt=""
                  className={styles.gameModeImage}
                />
              </div>
              <div style={{ width: '140px' }}>
                <Carousel autoplay={true} arrows={false} autoplaySpeed={3000} dots={false}>
                  <div className={`${styles.overlayRuleImageWrapper} ${styles.languageFalse}`}>
                    <IssueText text={'Map not visible'} style={{ right: '2px', bottom: '2px' }} />
                    <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                      <FalseThumb />
                    </div>
                    <img
                      src="https://media.cleanshot.cloud/media/14014/H0eg7miTPGXRgGnC4rQlfIQhkxrWwMSdIDxKjwN2.jpeg?Expires=1740507753&Signature=FX-pnffSAH-MrQXl7B6Dx-j1DDq8wmlripQr~zhWy1DFWMb1th3Atr-gKQwoGSguQswGNMQAd36bo7WBXDaUx1zukUGOPkKzS8qXnvYI1GmntFAvN4qrIJNM0vQglyk7FJ1kVjg3Y6m3xtaYmcgP6xl1tlBZh-k82QCuQn8ec6B~NqkYDE0nJcWYKFkG9hSjzts3T-6ltcnvPXc64Csf9qiCL-utvSzt5EToPwtT9rnkuV4RMJHfyYG7wg-QtKzt6RLklE7~wh1N0JMQDPclpsiGEAIk6Tgm7EwDpsdGK6-I~XAkwqQh6g02oDKYYHkO9reUQWwH9TvvcYMW8AYL9g__&Key-Pair-Id=K269JMAT9ZF4GZ"
                      alt=""
                      className={styles.gameModeImage}
                    />
                  </div>{' '}
                  <div className={`${styles.overlayRuleImageWrapper} ${styles.languageFalse}`}>
                    <IssueText
                      text={'Game not fullscreen'}
                      style={{ bottom: '2px', left: '2px' }}
                    />
                    <div style={{ position: 'absolute', top: '0px', left: '0px' }}>
                      <FalseThumb />
                    </div>
                    <img
                      src="https://media.cleanshot.cloud/media/14014/RUjyil8xXMJYeeIhtw9VS1VQKvhn4RafXb9Dpm5O.jpeg?Expires=1740507733&Signature=pJMnZEGnBI4P7GwOngQBbPVmVyaSYXDe4pdyGwkdQVgd3t9bqtUj9Ddqech-ECSvSso5S~8x5auBmgob8sZR0cq8KAhfhYWG4KzAIsWGqsgWdpQn6p81J5EuBAeaEzPs3fYDQOovmDMoNFNRy-VOBof1a1K74quct6mWwixdcCa~DD-BiXNolS44ei92RI~5bxs1CT1iQThWk~t9MZB-nQAKWq6k7VeGxChkjPVKK1FPwgR~YjahI9rMYBj91s1R3sk5QqM1cbg1qE70xVofqm1EY6YxoIt6I4CT~8jQwAP6JjPMbwqHIAjXTrl5t0vwQNMvN05OsA2HrcgtPWK81A__&Key-Pair-Id=K269JMAT9ZF4GZ"
                      alt=""
                      className={styles.gameModeImage}
                    />
                  </div>
                </Carousel>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Carousel>
  );
}

const CorrectThumb = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.944 4.31987L8.70856 2.83846C8.59655 2.13368 8.26003 1.54567 7.73766 1.16657C7.2153 0.787476 6.55193 0.649833 5.84715 0.761841L5.57137 0.80567C4.93373 0.907009 4.43247 1.405 4.32697 2.04197L3.41128 7.57045L3.39802 7.65049L3.33228 7.23682L2.83848 7.3153L1.85087 7.47226C1.44237 7.53718 1.08557 7.7357 0.851835 8.05777C0.618099 8.37984 0.539977 8.78061 0.604898 9.1891L1.54664 15.1147C1.61156 15.5232 1.81008 15.88 2.13215 16.1138C2.45422 16.3475 2.85499 16.4256 3.26349 16.3607L4.25109 16.2038L4.74489 16.1253L5.2387 16.0468L12.1519 14.9481C13.7462 14.6947 15.0807 13.32 15.0609 11.6335L15.2316 6.36552C15.358 4.81762 14.0028 3.51589 12.4006 3.77052L8.944 4.31987Z"
      fill="#128079"
      stroke="white"
    />
  </svg>
);

const FalseThumb = () => (
  <svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.21845 12.5659L5.83022 14.0148C5.64552 14.7041 5.71342 15.3782 6.03614 15.9371C6.35886 16.4961 6.90868 16.892 7.59798 17.0767L7.86771 17.1489C8.49136 17.316 9.15196 17.0653 9.50771 16.5265L12.5953 11.8501L12.64 11.7824L12.5316 12.187L13.0146 12.3164L13.9805 12.5752C14.3801 12.6822 14.7868 12.6462 15.1314 12.4473C15.476 12.2483 15.7106 11.9141 15.8176 11.5145L17.3706 5.71898C17.4776 5.31945 17.4416 4.91273 17.2426 4.5681C17.0437 4.22347 16.7094 3.98892 16.3099 3.88186L15.344 3.62304L14.861 3.49363L14.378 3.36422L7.61657 1.55249C6.05727 1.13468 4.27861 1.84681 3.60995 3.39518L1.30886 8.13713C0.563006 9.49937 1.27073 11.2402 2.83771 11.66L6.21845 12.5659Z"
      fill="#B14334"
      stroke="white"
    />
  </svg>
);

const IssueText = ({ text, style }: { text: string; style?: React.CSSProperties }) => (
  <div className={styles.issueText} style={style}>
    <p style={{ margin: 0 }}>{text}</p>
  </div>
);
