import ReactDOM from 'react-dom';
import React, { Component } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import AppBar from 'material-ui/AppBar';
import {Tabs, Tab} from 'material-ui/Tabs';
import Slider from 'material-ui/Slider';
import {GridList, GridTile} from 'material-ui/GridList';
import {teal50, green50, lime50} from 'material-ui/styles/colors';
import 'antd/dist/antd.min.css'
var cardBgColor0='#673AB7';
var cardBgColor1='#E91E63';
var cardBgColor2='#9C27B0';
var cardBgColor3='#311B92';
var cardBgColor4='#3F51B5';
var cardBgColor5='#1A237E';
var cardBgColor6='#009688';
var cardBgColor7='#FFC107';
var cardBgColor8='#FF9800';
var cardBgColor9='#00BFA5';
var muiTheme = getMuiTheme({
  palette: {
    primary1Color: '#FFF',
    primary2Color: lime50,
    primary3Color: teal50,
  },
}, {
  avatar: {
    borderColor: null,
  },
  appBar: {
    height: 60,
  },
});

const styles = {
  headline: {
    fontSize: 24,
    paddingTop: 16,
    marginBottom: 12,
    fontWeight: 400,
  },
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  gridList: {
    height:'60px',
    width:'80%',
    overflowY: 'hidden',
  },
};

class TopMenu extends React.Component{
  constructor(props){
    super(props);
    this.state={
      current:props.current,
    };
  }

  handleActive(tab) {
    location.href=tab.props['data-route'];
  }

  render() {
    return (
        <MuiThemeProvider muiTheme={muiTheme}>
          <div>
              <AppBar
                showMenuIconButton={false}
                zDepth={1}
                title="IServices平台"
                titleStyle={{width:'200px',flex:'',color:'#000'}}
                children={
                  <GridList
                    cols={6}
                    style={styles.gridList}
                  >
                    <GridTile
                      key={1}
                      cols={4}
                      style={{height:'60px'}}
                    >
                      <Tabs initialSelectedIndex={this.state.current}>
                        <Tab style={{color:'#000'}} label="首页" data-route="/" onActive={this.handleActive.bind(this)}/>
                        <Tab style={{color:'#000'}} label="产品管理" data-route="/product" onActive={this.handleActive.bind(this)}/>
                        <Tab style={{color:'#000'}} label="触发器管理" data-route="/trigger" onActive={this.handleActive.bind(this)}/>
                        <Tab style={{color:'#000'}} label="动作管理" data-route="/action" onActive={this.handleActive.bind(this)}/>
                        <Tab style={{color:'#000'}} label="小程序管理" data-route="/applet" onActive={this.handleActive.bind(this)}/>
                        <Tab style={{color:'#000'}} label="小程序实例管理" data-route="/applet/instance" onActive={this.handleActive.bind(this)}/>
                      </Tabs>
                    </GridTile>
                    <GridTile
                      key={2}
                      cols={2}
                      style={{height:'60px'}}
                    >
                      <div style={{lineHeight:'60px',color:'#FFF',textAlign:'right',color:'#000'}}>
                        欢迎您，{JSON.parse(document.getElementById('pageVarDef').value).userInfo.lastName},bucUserId:{JSON.parse(document.getElementById('pageVarDef').value).userInfo.id}
                      </div>
                    </GridTile>
                  </GridList>
                }
              />
            </div>
          </MuiThemeProvider>
      )
  }
}
module.exports = TopMenu;