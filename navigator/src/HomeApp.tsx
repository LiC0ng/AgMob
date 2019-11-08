import React from 'react';

const download_link_win = "https://elang.itsp.club/download/agmob-driver Setup 1.0.0.exe";
const download_link_mac = "https://elang.itsp.club/download/agmob-driver-1.0.0.AppImage";
const download_link_lin = "https://elang.itsp.club/download/agmob-driver-1.0.0.dmg";

interface IState {
    platformCode: number;
    package_version: string;
    package_size: string;
    package_date: string;
    package_new: string;
    package_link: string;
    popStatus: number;
}

export default class HomeApp extends React.Component<any, IState> {

    public constructor(props: any) {
        super(props);
        this.state = {
            platformCode: 0,
            package_version: "",
            package_size: "",
            package_date: "",
            package_new: "",
            package_link: "",
            popStatus: 1,
        };
        this.handlePopShow = this.handlePopShow.bind(this);
        this.handlePopClose = this.handlePopClose.bind(this);
    }

    public getOsInfo() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.indexOf('win') > -1) {
            this.setState({
                platformCode: 0,
            });
            this.handlePlatformChange(0);
        } else if (userAgent.indexOf('mac') > -1) {
            this.setState({
                platformCode: 1,
            });
            this.handlePlatformChange(1);
        } else if (userAgent.indexOf('linux') > -1) {
            this.setState({
                platformCode: 2,
            });
            this.handlePlatformChange(2);
        } else {
            this.setState({
                platformCode: 1,
            });
            this.handlePlatformChange(1);
        }
    }

    public handlePlatformChange(platformCode: number) {
        this.setState({
            platformCode: platformCode
        });
        if (platformCode === 0) {
            this.setState({
                package_version: "v 1.0.0",
                package_size: "61.09MB",
                package_date: "2019.11.05",
                package_link: download_link_win,
                package_new: "1.new function: fluorescent pen\n" +
                    "2.fix: UI"
            })
        } else if (platformCode === 1) {
            this.setState({
                package_version: "v 1.0.0",
                package_size: "82.97MB",
                package_date: "2019.11.05",
                package_link: download_link_mac,
                package_new: "1.new function: fluorescent pen\n" +
                    "2.fix: UI"
            })
        } else if (platformCode === 2) {
            this.setState({
                package_version: "v 1.0.0",
                package_size: "95.98MB",
                package_date: "2019.11.05",
                package_link: download_link_lin,
                package_new: "1.new function: fluorescent pen\n" +
                    "2.fix: UI"
            })
        }
        this.changeOpacityOfPlatform(platformCode);
    }


    public changeOpacityOfPlatform(e: number) {
        const arr = document.getElementsByClassName("platform");
        for (let i = 0; i < arr.length; i++) {
            if (i === e) {
                arr[e].classList.add("selected");
                arr[e].classList.remove("unselected");
            } else {
                arr[i].classList.add("unselected");
                arr[i].classList.remove("selected");
            }
        }
    }

    public handlePopShow() {
        const pop = document.getElementById("pop");
        if (pop && this.state.popStatus % 2 === 1) {
            pop.style.display = "block"
        }
        this.setState({
            popStatus: this.state.popStatus + 1
        })
    }

    public handlePopClose() {
        const pop = document.getElementById("pop");
        if (pop && this.state.popStatus % 2 === 0) {
            pop.style.display = "none"
        }
    }

    componentDidMount(): void {
        this.getOsInfo();
    }

    render() {
        return (
            <div className="content">
                <div className="mod_head">
                    <div className="mod_head_inner max_width">
                        <div className="mod_head_logo">
                            {/*put logo here*/}
                            （Icon)
                            <a href="https://elang.itsp.club" className="mod_head_logo_word">AgMob</a>
                        </div>
                        <div className="mod_head_menu">
                            <a href="https://github.com/Linsho/AgMob/issues"
                               className="mod_head_menu_item">Feedback</a>
                            <a href="https://github.com/Linsho/AgMob" className="mod_head_menu_item">Source Code</a>
                        </div>
                    </div>
                </div>
                <div className="main">
                    <div className="product_info" style={{display: "block"}}>
                        <div className="product_info_top">
                            <div className="product_title">AgMob
                                for {this.state.platformCode === 0 ? "Windows" : this.state.platformCode === 1 ? "Mac" : "Linux"}</div>
                            <div className="product_slogan">
                                <div className=" slogan_1">
                                    Mob Programming Anywhere
                                </div>
                            </div>
                        </div>
                        <div className="product_plat"
                             style={{display: "inline-block"}}>
                            <div className="product_version_yes">
                                <div
                                    className="version_info">{this.state.package_version} | {this.state.package_size} | {this.state.package_date}
                                    <span>What's New</span>
                                    <div className="showpop" onClick={this.handlePopShow}>
                                        <div className="pop" id="pop" style={{display: "none"}}>
                                            <h5 className="pop_title">{this.state.package_version} What's New</h5>
                                            <p className="popcontent_item">{this.state.package_new}</p>
                                            <div className="icon_close" onClick={this.handlePopClose}></div>
                                        </div>
                                    </div>
                                </div>
                                <a href={this.state.package_link}>
                                    <div className="download_btn"
                                         data-downloadurl={this.state.package_link}>Download
                                    </div>
                                </a>
                                <div className="qrcode" style={{display: "none"}}></div>
                            </div>

                        </div>
                        {/*android
                    <div class="product_plat" id="product_plat_3" style="display: none;">

                         <div className="product_version_yes">
                            <div className="version_info">v 1.0.0 | 00.00MB | 2019.10.1 <span>What's New</span>
                                <div className="showpop">
                                    <div className="pop" style={{display: "none"}}>
                                        <h5 className="pop_title">v 1.0.0 What's New</h5>
                                        <p className="popcontent_item">1 aaa；
                                            2 bbb；
                                            3 ccc；</p>
                                        <div className="icon_close"></div>
                                    </div>
                                </div>
                            </div>
                            <a href="https://elang.itsp.club/download/agmob-driver Setup 1.0.0.exe" target="_blank">
                                <div className="download_btn"
                                     data-downloadurl="https://elang.itsp.club/download/agmob-driver Setup 1.0.0.exe">Download
                                </div>
                            </a>
                            <div className="qrcode" style={{display: "none"}}></div>
                        </div>
                        </div>

                </div>*/}
                    </div>
                </div>
                <div className="footer">
                    <div className="foot_main">
                        <div className="platform_container">
                            <div className="platform" id="plat0" onClick={() => this.handlePlatformChange(0)}>
                                <span className="icon_plat_win"></span>
                                <span className="word_plat">Windows</span>
                            </div>
                            <div className="platform" id="plat1" onClick={() => this.handlePlatformChange(1)}>
                                <span className="icon_plat_mac"></span>
                                <span className="word_plat">Mac</span>
                            </div>
                            <div className="platform" id="plat2" onClick={() => this.handlePlatformChange(2)}>
                                <span className="icon_plat_linux"></span>
                                <span className="word_plat">Linux</span>
                            </div>
                            {/*                        <div className="platform" data-index="3">
                            <span className="icon_plat_android"></span>
                            <span className="word_plat">Android</span>
                        </div>*/}
                        </div>
                        <div className="copyrighten">
                            Made By Elang
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
