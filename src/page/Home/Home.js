import ReactDOM from 'react-dom';
import React, { Component } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Paper from 'material-ui/Paper';
import LinearProgress from 'material-ui/LinearProgress';
import {GridList, GridTile} from 'material-ui/GridList';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import RaisedButton from 'material-ui/RaisedButton';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

import './Home.css'
import TopMenu from '../../components/TopMenu'
import {cardBgColors} from '../../components/CardBgColor'

const paperStyle = {
  display: 'inline',
  overFlowY:'auto'
};

class Home extends Component {
  constructor(){
    super()
    this.state={
      loadFinish:false,
      serverData:null
    }
  }

  componentDidMount(){
    this.renderList();
  }

  renderList(){
    let me=this;
     me.setState({
        loadFinish:false
      });
    const listUrl='/applet/all/list.json';
    var dataArray=[];
    $.get(listUrl,
    {
      currentPage:0,
      pageSize:100
    },
      function(data){
        if(data.success){
          me.setState({
            loadFinish:true,
            serverData:data.content.data
          })
        }else{
          me.setState({
            loadFinish:true,
            serverData:null
          })
        }
      }
    )
  }
  
  userBtClick(appletId){
    location.href="/applet/instance/create/"+appletId;
  }
  render() {
      return (
        <div>
          <MuiThemeProvider>
          <div>
            <TopMenu current={0}/>
            {
              this.state.loadFinish==false?<LinearProgress mode='indeterminate' />:null
            }
            <div style={{width:'70%',marginLeft:'15%',marginTop:'20px'}}>
          {
            this.state.serverData?this.state.serverData.map((item)=>{
              let colorIndex = item.id % 10;
              let bgColor = cardBgColors[colorIndex];
              return(
                <Card key={item.id} onClick={this.userBtClick.bind(this,item.id)} style={{borderRadius:'.5em',cursor:'pointer',height:'230px',width:'32%',float:'left',margin:'5px',backgroundColor:bgColor}}>
                      <CardTitle titleColor='#FAFAFA' subtitleColor='#FAFAFA' title={item.name} subtitle={item.identity} titleStyle={{height:'70px',overflow:'hidden'}}/>
                      <CardText color='#FAFAFA' style={{height:'120px',overflow:'hidden'}}>
                        {item.description}
                      </CardText>
                  </Card>)
            }):null
          }
           </div>
          </div>
          </MuiThemeProvider>
        </div>
      )
  }
}

ReactDOM.render(<Home />, document.getElementById('App'));
