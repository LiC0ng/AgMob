import React from 'react';

const HomeApp: React.FC = () => {
  return (
    <div className="is-responsive">
      <div className="footer-push">
        <nav className="top-bar" aria-label="Primary">
            AgMob            
            <ul className="navigation">
              <li>
                <a href="https://github.com/Linsho/AgMob/issues">Feedback</a>
              </li>
            </ul>
        </nav>
        <div className="main">
            <ul className="download">
              Download the file that apply to your OS.
                <li>
                  <a href="https://elang.itsp.club/download/agmob-driver Setup 1.0.0.exe">Windows(agmob-driver-1.0.0.exe)</a>
                </li>
                <li>
                  <a href="https://elang.itsp.club/download/agmob-driver-1.0.0.AppImage">Linux(agmob-driver-1.0.0.AppImage)</a>
                </li>
                <li>
                  <a href="https://elang.itsp.club/download/agmob-driver-1.0.0.dmg">Mac(agmob-driver-1.0.0.dmg)</a>
                </li>
              </ul>
        </div>
      </div>
    </div>
  );
}

export default HomeApp;
