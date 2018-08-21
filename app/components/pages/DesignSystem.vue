<template>
  <div class="design-system">
    <h1>Design System</h1>
    <p>All inclusive guide for Streamlabs OBS styles, reusable components, assets, etc</p>
    <div class="design-system__wrapper">
      <div class="design-system__menu">
        <a class="link link--uppercase" href="#buttons">Buttons</a>
        <a class="link link--uppercase" href="#colors">Colors</a>
        <a class="link link--uppercase" href="#dropdowns">Dropdowns</a>
        <a class="link link--uppercase" href="#icons">Icons</a>
        <a class="link link--uppercase" href="#inputs">Inputs</a>
        <a class="link link--uppercase" href="#mixins">Mixins</a>
        <a class="link link--uppercase" href="#states">States</a>
      </div>

      <div class="design-system__body">
        <div id="buttons" class="design-system__section">
          <h2>Buttons</h2>
          <h4>Buttons</h4>
          <div class="button-container">
            <button class="button button--default">Button Standard</button>
            <button class="button button--action">Button Action</button>
            <button class="button button--soft-warning">Button Soft Warning</button>
            <button class="button button--trans">Button Transparent</button>
            <button class="button button--action is-disabled">Button Disabled</button>
          </div>
          <h4>Square Buttons</h4>
          <div class="button-container">
            <button class="square-button button--twitch"><i class="fab fa-twitch"></i></button>
            <button class="square-button button--yt"><i class="fab fa-youtube"></i></button>
            <button class="square-button button--mixer"><i class="fas fa-times"></i></button>
          </div>
          <h4>Icon Buttons</h4>
          <div class="button-container">
            <i class="icon-settings icon-button"></i>
            <i class="icon-settings icon-button icon-button--lg"></i>
          </div>
        </div>

        <div id="colors" class="design-system__section">
          <h2>Colors</h2>
          <div class="design-system__colors">
            <div class="design-system__color-section">
              <div class="design-system__color-wrapper">
                <div class="design-system__color design-system__color--primary"></div>
                <div>
                  <div class="design-system__code">@primary, @teal</div>
                  <div>Action Buttons, Label</div>
                </div>
              </div>
              <div class="design-system__color-wrapper">
                <div class="design-system__color design-system__color--secondary"></div>
                <div>
                  <div class="design-system__code">@secondary, @purple</div>
                  <div>Alt, Tags</div>
                </div>
              </div>
              <div class="design-system__color-wrapper">
                <div class="design-system__color design-system__color--warning"></div>
                <div>
                  <div class="design-system__code">@warning, @red</div>
                  <div>Warnings, Errors, Count Badges</div>
                </div>
              </div>
              <div class="design-system__color-wrapper">
                <div class="design-system__color design-system__color--other-1"></div>
                <div>
                  <div class="design-systemday-bg__code">@new, @yellow</div>
                  <div>New</div>
                </div>
              </div>
              <div class="design-system__color-wrapper">
                <div class="design-system__color design-system__color--other-2"></div>
                <div>
                  <div class="design-system__code">@info-dark, @yellow-dark</div>
                  <div>Info</div>
                </div>
              </div>
              <div class="design-system__color-wrapper">
                <div class="design-system__color design-system__color--other-3"></div>
                <div>
                  <div class="design-system__code">@info-light, @yellow-light</div>
                  <div>Info</div>
                </div>
              </div>
            </div>
            <div class="design-system__color-section">
              <div class="design-system__color-wrapper">
                <div class="design-system__color design-system__color--white"></div>
                <div>
                  <div class="design-system__code">@day-section, @night-title, @white</div>
                  <div>Day Background, Night Title</div>
                </div>
              </div>
              <div class="design-system__color-wrapper">
                <div class="design-system__color design-system__color--light-1"></div>
                <div>
                  <div class="design-system__code">@day-section, @light-1</div>
                  <div>Day Sections Background, Day Cards</div>
                </div>
              </div>
              <div class="design-system__color-wrapper">
                <div class="design-system__color design-system__color--light-2"></div>
                <div>
                  <div class="design-system__code">@day-button, @day-input-border, @light-2</div>
                  <div>Day Button Background, Day Input Border</div>
                </div>
              </div>
              <div class="design-system__color-wrapper">
                <div class="design-system__color design-system__color--light-3"></div>
                <div>
                  <div class="design-system__code">@day-section, @light-3</div>
                  <div>Night Paragraph</div>
                </div>
              </div>
              <div class="design-system__color-wrapper">
                <div class="design-system__color design-system__color--light-4"></div>
                <div>
                  <div class="design-system__code">@icon, @light-4</div>
                  <div>Day + Night Icons, Day Caption</div>
                </div>
              </div>
            </div>
            <div class="design-system__color-section">
              <div class="design-system__color-wrapper">
                <div class="design-system__color design-system__color--dark-1"></div>
                <div>
                  <div class="design-system__code">@dark-1</div>
                  <div>Night Video, App Store Background</div>
                </div>
              </div>
              <div class="design-system__color-wrapper">
                <div class="design-system__color design-system__color--dark-2"></div>
                <div>
                  <div class="design-system__code">@day-title, @night-section, @dark-2</div>
                  <div>Day Title, Night Sections Background</div>
                </div>
              </div>
              <div class="design-system__color-wrapper">
                <div class="design-system__color design-system__color--dark-3"></div>
                <div>
                  <div class="design-system__code">@night-bg, @dark-3</div>
                  <div>Night Background</div>
                </div>
              </div>
              <div class="design-system__color-wrapper">
                <div class="design-system__color design-system__color--dark-4"></div>
                <div>
                  <div class="design-system__code">@night-section-alt, @dark-4</div>
                  <div>Night Sections Alt Background (lighter), Night Cards</div>
                </div>
              </div>
              <div class="design-system__color-wrapper">
                <div class="design-system__color design-system__color--dark-5"></div>
                <div>
                  <div class="design-system__code">@day-paragraph, @dark-5</div>
                  <div>Day Paragraph, Night Standard Button</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="dropdowns" class="design-system__section">
          <h2>Dropdowns</h2>

          <DropdownMenu :title="activeDropdownItem.name">
            <div
              v-for="dropdownItem in dropdownItems"
              :key="dropdownItem.id"
              class="dropdown-menu__item"
              :class="{ 'is-active': activeId === dropdownItem.id }">
              {{ dropdownItem.name }}
            </div>
          </DropdownMenu>
        </div>

        <div id="icons" class="design-system__section">
          <h2>Icons</h2>
          <p>We use a combination of <a href="https://fontawesome.com/icons?d=gallery" target="_blank">FontAwesome 5.1.0</a> and our own <a href="https://www.dropbox.com/s/dlu2faapsgcurcs/icomoon.zip?dl=0" target="_blank">custom icons</a>.</p>

          <div class="design-system__icons">
            <div>
              <span class="icon-check-mark"></span>
              <span class="mls"> icon-check-mark</span>
            </div>
            <div>
              <span class="icon-bag"></span>
              <span class="mls"> icon-bag</span>
            </div>
            <div>
              <span class="icon-pillow"></span>
              <span class="mls"> icon-pillow</span>
            </div>
            <div>
              <span class="icon-editor"></span>
              <span class="mls"> icon-editor</span>
            </div>
            <div>
              <span class="icon-align-center-horizontal"></span>
              <span class="mls"> icon-align-center-horizontal</span>
            </div>
            <div>
              <span class="icon-align-center-vertical"></span>
              <span class="mls"> icon-align-center-vertical</span>
            </div>
            <div>
              <span class="icon-canvas"></span>
              <span class="mls"> icon-canvas</span>
            </div>
            <div>
              <span class="icon-cut-sew"></span>
              <span class="mls"> icon-cut-sew</span>
            </div>
            <div>
              <span class="icon-fit"></span>
              <span class="mls"> icon-fit</span>
            </div>
            <div>
              <span class="icon-framed-poster"></span>
              <span class="mls"> icon-framed-poster</span>
            </div>
            <div>
              <span class="icon-mug"></span>
              <span class="mls"> icon-mug</span>
            </div>
            <div>
              <span class="icon-phone-case"></span>
              <span class="mls"> icon-phone-case</span>
            </div>
            <div>
              <span class="icon-poster"></span>
              <span class="mls"> icon-poster</span>
            </div>
            <div>
              <span class="icon-reset"></span>
              <span class="mls"> icon-reset</span>
            </div>
            <div>
              <span class="icon-resize-horizontal"></span>
              <span class="mls"> icon-resize-horizontal</span>
            </div>
            <div>
              <span class="icon-resize-vertical"></span>
              <span class="mls"> icon-resize-vertical</span>
            </div>
            <div>
              <span class="icon-resize"></span>
              <span class="mls"> icon-resize</span>
            </div>
            <div>
              <span class="icon-search"></span>
              <span class="mls"> icon-search</span>
            </div>
            <div>
              <span class="icon-upperwear"></span>
              <span class="mls"> icon-upperwear</span>
            </div>
            <div>
              <span class="icon-upload-image"></span>
              <span class="mls"> icon-upload-image</span>
            </div>
            <div>
              <span class="icon-cloud-backup-2"></span>
              <span class="mls"> icon-cloud-backup-2</span>
            </div>
            <div>
              <span class="icon-cloud-backup"></span>
              <span class="mls"> icon-cloud-backup</span>
            </div>
            <div>
              <span class="icon-cloud"></span>
              <span class="mls"> icon-cloud</span>
            </div>
            <div>
              <span class="icon-studio-mode-4"></span>
              <span class="mls"> icon-studio-mode-4</span>
            </div>
            <div>
              <span class="icon-studio-mode-3"></span>
              <span class="mls"> icon-studio-mode-3</span>
            </div>
            <div>
              <span class="icon-studio-mode-2"></span>
              <span class="mls"> icon-studio-mode-2</span>
            </div>
            <div>
              <span class="icon-studio-mode"></span>
              <span class="mls"> icon-studio-mode</span>
            </div>
            <div>
              <span class="icon-dashboard"></span>
              <span class="mls"> icon-dashboard</span>
            </div>
            <div>
              <span class="icon-discord"></span>
              <span class="mls"> icon-discord</span>
            </div>
            <div>
              <span class="icon-information"></span>
              <span class="mls"> icon-information</span>
            </div>
            <div>
              <span class="icon-check"></span>
              <span class="mls"> icon-check</span>
            </div>
            <div>
              <span class="icon-unlock"></span>
              <span class="mls"> icon-unlock</span>
            </div>
            <div>
              <span class="icon-down"></span>
              <span class="mls"> icon-down</span>
            </div>
            <div>
              <span class="icon-streamlabs"></span>
              <span class="mls"> icon-streamlabs</span>
            </div>
            <div>
              <span class="icon-add-circle"></span>
              <span class="mls"> icon-add-circle</span>
            </div>
            <div>
              <span class="icon-add-folder"></span>
              <span class="mls"> icon-add-folder</span>
            </div>
            <div>
              <span class="icon-add"></span>
              <span class="mls"> icon-add</span>
            </div>
            <div>
              <span class="icon-alert-box"></span>
              <span class="mls"> icon-alert-box</span>
            </div>
            <div>
              <span class="icon-announcement"></span>
              <span class="mls"> icon-announcement</span>
            </div>
            <div>
              <span class="icon-audio"></span>
              <span class="mls"> icon-audio</span>
            </div>
            <div>
              <span class="icon-back"></span>
              <span class="mls"> icon-back</span>
            </div>
            <div>
              <span class="icon-balance"></span>
              <span class="mls"> icon-balance</span>
            </div>
            <div>
              <span class="icon-camera-off"></span>
              <span class="mls"> icon-camera-off</span>
            </div>
            <div>
              <span class="icon-camera"></span>
              <span class="mls"> icon-camera</span>
            </div>
            <div>
              <span class="icon-card-set"></span>
              <span class="mls"> icon-card-set</span>
            </div>
            <div>
              <span class="icon-chat-box"></span>
              <span class="mls"> icon-chat-box</span>
            </div>
            <div>
              <span class="icon-close"></span>
              <span class="mls"> icon-close</span>
            </div>
            <div>
              <span class="icon-community"></span>
              <span class="mls"> icon-community</span>
            </div>
            <div>
              <span class="icon-copy"></span>
              <span class="mls"> icon-copy</span>
            </div>
            <div>
              <span class="icon-cpu"></span>
              <span class="mls"> icon-cpu</span>
            </div>
            <div>
              <span class="icon-date"></span>
              <span class="mls"> icon-date</span>
            </div>
            <div>
              <span class="icon-donation-goal"></span>
              <span class="mls"> icon-donation-goal</span>
            </div>
            <div>
              <span class="icon-donation-settings"></span>
              <span class="mls"> icon-donation-settings</span>
            </div>
            <div>
              <span class="icon-donation-ticker"></span>
              <span class="mls"> icon-donation-ticker</span>
            </div>
            <div>
              <span class="icon-earnings"></span>
              <span class="mls"> icon-earnings</span>
            </div>
            <div>
              <span class="icon-edit"></span>
              <span class="mls"> icon-edit</span>
            </div>
            <div>
              <span class="icon-event-list"></span>
              <span class="mls"> icon-event-list</span>
            </div>
            <div>
              <span class="icon-expand"></span>
              <span class="mls"> icon-expand</span>
            </div>
            <div>
              <span class="icon-face-masks"></span>
              <span class="mls"> icon-face-masks</span>
            </div>
            <div>
              <span class="icon-filter"></span>
              <span class="mls"> icon-filter</span>
            </div>
            <div>
              <span class="icon-full-screen-alt"></span>
              <span class="mls"> icon-full-screen-alt</span>
            </div>
            <div>
              <span class="icon-full-screen"></span>
              <span class="mls"> icon-full-screen</span>
            </div>
            <div>
              <span class="icon-graph"></span>
              <span class="mls"> icon-graph</span>
            </div>
            <div>
              <span class="icon-group"></span>
              <span class="mls"> icon-group</span>
            </div>
            <div>
              <span class="icon-guild"></span>
              <span class="mls"> icon-guild</span>
            </div>
            <div>
              <span class="icon-hide-video"></span>
              <span class="mls"> icon-hide-video</span>
            </div>
            <div>
              <span class="icon-hide"></span>
              <span class="mls"> icon-hide</span>
            </div>
            <div>
              <span class="icon-hotkeys"></span>
              <span class="mls"> icon-hotkeys</span>
            </div>
            <div>
              <span class="icon-image"></span>
              <span class="mls"> icon-image</span>
            </div>
            <div>
              <span class="icon-integrations-2"></span>
              <span class="mls"> icon-integrations-2</span>
            </div>
            <div>
              <span class="icon-integrations"></span>
              <span class="mls"> icon-integrations</span>
            </div>
            <div>
              <span class="icon-jar"></span>
              <span class="mls"> icon-jar</span>
            </div>
            <div>
              <span class="icon-leaderboard-2"></span>
              <span class="mls"> icon-leaderboard-2</span>
            </div>
            <div>
              <span class="icon-leaderboard-3"></span>
              <span class="mls"> icon-leaderboard-3</span>
            </div>
            <div>
              <span class="icon-leaderboard"></span>
              <span class="mls"> icon-leaderboard</span>
            </div>
            <div>
              <span class="icon-link"></span>
              <span class="mls"> icon-link</span>
            </div>
            <div>
              <span class="icon-live-dashboard"></span>
              <span class="mls"> icon-live-dashboard</span>
            </div>
            <div>
              <span class="icon-lock-2"></span>
              <span class="mls"> icon-lock-2</span>
            </div>
            <div>
              <span class="icon-lock"></span>
              <span class="mls"> icon-lock</span>
            </div>
            <div>
              <span class="icon-logout"></span>
              <span class="mls"> icon-logout</span>
            </div>
            <div>
              <span class="icon-loyalty-1"></span>
              <span class="mls"> icon-loyalty-1</span>
            </div>
            <div>
              <span class="icon-loyalty"></span>
              <span class="mls"> icon-loyalty</span>
            </div>
            <div>
              <span class="icon-mic"></span>
              <span class="mls"> icon-mic</span>
            </div>
            <div>
              <span class="icon-more"></span>
              <span class="mls"> icon-more</span>
            </div>
            <div>
              <span class="icon-move"></span>
              <span class="mls"> icon-move</span>
            </div>
            <div>
              <span class="icon-multistream"></span>
              <span class="mls"> icon-multistream</span>
            </div>
            <div>
              <span class="icon-music"></span>
              <span class="mls"> icon-music</span>
            </div>
            <div>
              <span class="icon-mute-mic"></span>
              <span class="mls"> icon-mute-mic</span>
            </div>
            <div>
              <span class="icon-mute"></span>
              <span class="mls"> icon-mute</span>
            </div>
            <div>
              <span class="icon-notifications"></span>
              <span class="mls"> icon-notifications</span>
            </div>
            <div>
              <span class="icon-output"></span>
              <span class="mls"> icon-output</span>
            </div>
            <div>
              <span class="icon-overview"></span>
              <span class="mls"> icon-overview</span>
            </div>
            <div>
              <span class="icon-pause"></span>
              <span class="mls"> icon-pause</span>
            </div>
            <div>
              <span class="icon-platforms"></span>
              <span class="mls"> icon-platforms</span>
            </div>
            <div>
              <span class="icon-playing"></span>
              <span class="mls"> icon-playing</span>
            </div>
            <div>
              <span class="icon-pop-out-1"></span>
              <span class="mls"> icon-pop-out-1</span>
            </div>
            <div>
              <span class="icon-pop-out-2"></span>
              <span class="mls"> icon-pop-out-2</span>
            </div>
            <div>
              <span class="icon-question"></span>
              <span class="mls"> icon-question</span>
            </div>
            <div>
              <span class="icon-reduce-screen-alt"></span>
              <span class="mls"> icon-reduce-screen-alt</span>
            </div>
            <div>
              <span class="icon-reduce-screen"></span>
              <span class="mls"> icon-reduce-screen</span>
            </div>
            <div>
              <span class="icon-remove-circle"></span>
              <span class="mls"> icon-remove-circle</span>
            </div>
            <div>
              <span class="icon-repeat"></span>
              <span class="mls"> icon-repeat</span>
            </div>
            <div>
              <span class="icon-settings-3-1"></span>
              <span class="mls"> icon-settings-3-1</span>
            </div>
            <div>
              <span class="icon-settings"></span>
              <span class="mls"> icon-settings</span>
            </div>
            <div>
              <span class="icon-share"></span>
              <span class="mls"> icon-share</span>
            </div>
            <div>
              <span class="icon-skip"></span>
              <span class="mls"> icon-skip</span>
            </div>
            <div>
              <span class="icon-store"></span>
              <span class="mls"> icon-store</span>
            </div>
            <div>
              <span class="icon-stream-labels"></span>
              <span class="mls"> icon-stream-labels</span>
            </div>
            <div>
              <span class="icon-studio"></span>
              <span class="mls"> icon-studio</span>
            </div>
            <div>
              <span class="icon-subtract"></span>
              <span class="mls"> icon-subtract</span>
            </div>
            <div>
              <span class="icon-suggestions"></span>
              <span class="mls"> icon-suggestions</span>
            </div>
            <div>
              <span class="icon-team-2"></span>
              <span class="mls"> icon-team-2</span>
            </div>
            <div>
              <span class="icon-team"></span>
              <span class="mls"> icon-team</span>
            </div>
            <div>
              <span class="icon-text"></span>
              <span class="mls"> icon-text</span>
            </div>
            <div>
              <span class="icon-themes"></span>
              <span class="mls"> icon-themes</span>
            </div>
            <div>
              <span class="icon-time"></span>
              <span class="mls"> icon-time</span>
            </div>
            <div>
              <span class="icon-transition"></span>
              <span class="mls"> icon-transition</span>
            </div>
            <div>
              <span class="icon-trash"></span>
              <span class="mls"> icon-trash</span>
            </div>
            <div>
              <span class="icon-treat"></span>
              <span class="mls"> icon-treat</span>
            </div>
            <div>
              <span class="icon-user"></span>
              <span class="mls"> icon-user</span>
            </div>
            <div>
              <span class="icon-view"></span>
              <span class="mls"> icon-view</span>
            </div>
            <div>
              <span class="icon-webcam"></span>
              <span class="mls"> icon-webcam</span>
            </div>
            <div>
              <span class="icon-widgets"></span>
              <span class="mls"> icon-widgets</span>
            </div>
            <div>
              <span class="icon-wish-list"></span>
              <span class="mls"> icon-wish-list</span>
            </div>
            <div>
              <span class="icon-stats"></span>
              <span class="mls"> icon-stats</span>
            </div>
          </div>
        </div>

        <div id="inputs" class="design-system__section">
          <h2>Inputs</h2>
          <div class="input-container">
            <div class="input-label">
              Example Checkbox
            </div>
            <div class="input-wrapper">
              <div class="checkbox">
                <input
                  type="checkbox"
                  v-model="exampleSettings.checkbox_standard"/>
                <label>{{ $t('Include Resubs') }}</label>
              </div>
            </div>
          </div>

          <form-group title="Form Group">
            <bool-input title="Example 1" v-model="exampleSettings.checkbox_1"/>
            <bool-input title="Example 2" v-model="exampleSettings.checkbox_2"/>
            <bool-input title="Example 3" v-model="exampleSettings.checkbox_3"/>
            <bool-input title="Example 4" v-model="exampleSettings.checkbox_4"/>
          </form-group>

          <form-group title="Form Group">
            <slider-input v-model="exampleSettings.slider" :metadata="{min: 0, max: 100}"/>
          </form-group>

          <form-group title="Text Input">
            <input type="text" placeholder="Example Text Input">
          </form-group>

          <form-group title="Text Input - Disabled">
            <input type="text" disabled placeholder="Example Text Input">
          </form-group>
        </div>

        <div id="mixins" class="design-system__section">
          <h2>Mixins</h2>
          <table>
            <thead>
              <tr>
                <th>Class Name</th>
                <th>Attributes</th>
                <th>Default (Base)</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="design-system__code">.aspect-ratio()</td>
                <td>16,9 or 4,3</td>
                <td>-</td>
                <td>Relative width and height sizing - takes a width and height attribute</td>
              </tr>
              <tr>
                <td class="design-system__code">.margin()</td>
                <td>1, 2, 3, 4</td>
                <td>1 (8px)</td>
                <td>Add right margin to any element. 2 = 16px, 3 = 24px, etc</td>
              </tr>
              <tr>
                <td class="design-system__code">.margin-top()</td>
                <td>1, 2, 3, 4</td>
                <td>1 (8px)</td>
                <td>Add top margin to any element</td>
              </tr>
              <tr>
                <td class="design-system__code">.margin-right()</td>
                <td>1, 2, 3, 4</td>
                <td>1 (8px)</td>
                <td>Add right margin to any element</td>
              </tr>
              <tr>
                <td class="design-system__code">.margin-bottom()</td>
                <td>1, 2, 3, 4</td>
                <td>1 (8px)</td>
                <td>Add bottom margin to any element</td>
              </tr>
              <tr>
                <td class="design-system__code">.margin-left()</td>
                <td>1, 2, 3, 4</td>
                <td>1 (8px)</td>
                <td>Add left margin to any element</td>
              </tr>
              <tr>
                <td class="design-system__code">.padding()</td>
                <td>1, 2, 3, 4</td>
                <td>1 (8px)</td>
                <td>Add right padding to any element</td>
              </tr>
              <tr>
                <td class="design-system__code">.padding-top()</td>
                <td>1, 2, 3, 4</td>
                <td>1 (8px)</td>
                <td>Add top padding to any element</td>
              </tr>
              <tr>
                <td class="design-system__code">.padding-right()</td>
                <td>1, 2, 3, 4</td>
                <td>1 (8px)</td>
                <td>Add right padding to any element</td>
              </tr>
              <tr>
                <td class="design-system__code">.padding-bottom()</td>
                <td>1, 2, 3, 4</td>
                <td>1 (8px)</td>
                <td>Add bottom padding to any element</td>
              </tr>
              <tr>
                <td class="design-system__code">.padding-left()</td>
                <td>1, 2, 3, 4</td>
                <td>1 (8px)</td>
                <td>Add left padding to any element</td>
              </tr>
              <tr>
                <td class="design-system__code">.radius()</td>
                <td>1, 2</td>
                <td>1 (4px)</td>
                <td>Add border radius to elements. 1 (4px) is standard, 2 (8px) is for larger sections</td>
              </tr>
              <tr>
                <td class="design-system__code">.weight()</td>
                <td>@normal, @medium, @bold</td>
                <td>@normal</td>
                <td>Adjust the font-weight of text</td>
              </tr>
            </tbody>
          </table>
        </div>
     </div>
    </div>
  </div>
</template>

<script lang="ts" src="./DesignSystem.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.design-system {
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
}

.design-system__wrapper {
  display: flex;
  width: 100%;
  height: 100%;
}

.design-system__menu {
  flex: 0 0 200px;
  .flex;
  flex-direction: column;

  .link {
    margin-bottom: 16px;
  }
}

.design-system__body {
  flex: 1;
}

.design-system__section {
  margin-bottom: 40px;
}

.design-system__colors {
  display: flex;
}

.design-system__color-section {
  flex: 1;
}

.design-system__color-wrapper {
  .flex;
  align-items: center;
  margin-bottom: 8px;
}

.design-system__color {
  width: 30px;
  height: 30px;
  .radius;
  border: 1px solid transparent;
  margin-right: 8px;
}

.design-system__color--primary {
  background-color: @primary;
}

.design-system__color--secondary {
  background-color: @secondary;
}

.design-system__color--warning {
  background-color: @warning;
}

.design-system__color--other-1 {
  background-color: @yellow;
}

.design-system__color--other-2 {
  background-color: @yellow-dark;
}

.design-system__color--other-3 {
  background-color: @yellow-light;
}

.design-system__color--white {
  background-color: @white;
  border-color: @light-4;
}

.design-system__color--light-1 {
  background-color: @light-1;
}

.design-system__color--light-2 {
  background-color: @light-2;
}

.design-system__color--light-3 {
  background-color: @light-3;
}

.design-system__color--light-4 {
  background-color: @light-4;
}

.design-system__color--dark-1 {
  background-color: @dark-1;
}

.design-system__color--dark-2 {
  background-color: @dark-2;
}

.design-system__color--dark-3 {
  background-color: @dark-3;
  border-color: @light-4;
}

.design-system__color--dark-4 {
  background-color: @dark-4;
}

.design-system__color--dark-5 {
  background-color: @dark-5;
}

.design-system__icons {
  .flex;
  .flex--wrap;

  div {
    padding: 10px;
    flex: 0 0 20%;

    span {
      &:nth-child(1) {
        margin-right: 8px;
        font-size: 16px;
        width: 26px;
        display: inline-block;
      }
    }
  }
}

.design-system__code {
  font-family: 'Courier New', Courier, monospace;
}

.button-container {
  .margin-bottom(2);
}
</style>
