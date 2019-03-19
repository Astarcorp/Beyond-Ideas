import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Plot from 'react-plotly.js';
import WordCloud from 'react-d3-cloud'
// import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import MUIDataTable from 'mui-datatables';

import "../css/main";

var $ = require('jquery');

class Analysisbi extends Component {  

  constructor() {
    super();
    this.state = {
      options: "",
      selectedtable: "", 
      tablename: "",            
      hideLoadingBar: true,    
      barchart: "",
      columns: "",
      values: "",
      tableboolean: false,
      tableboolean: false,
      topiccolumns: "",
      topicvalues: "",
      topicvalues2: "",
      topicvalues3: "",
      textdataPositive: [],
      textdataNegative: [],
      fontSizeMapper: word => Math.log2(word.value) * 5,
      rotate: word => word.value % 180
    };

    this.getMySQLTables = this.getMySQLTables.bind(this);
    this.selectTable = this.selectTable.bind(this);

    this.trainModel = this.trainModel.bind(this);

    this.barChart = this.barChart.bind(this);

    this.generatePlot = this.generatePlot.bind(this); 

    this.generateWordCloud = this.generateWordCloud.bind(this);
   
    this.formSubmitted = this.formSubmitted.bind(this);   

    this.callBackendAPI = this.callBackendAPI.bind(this);

    this.getMySQLTables(); //retrieving user's uploaded tables

    this.loadingBarInstance = (
      <div className="loader"></div>                                   
    );       
  }

  //retrieving user's uploaded tables   
  getMySQLTables() {
    var mySQLTables = "";
    this.callBackendAPI("/get_all_dataset_api")
    .then(res => {
      // console.log(res);
      // console.log(res.datasetNames);
      // this.setState({ datasetNames: res.datasets });
      var datasetNames = res.datasetNames;
      var mySQLTables = [];
      datasetNames.map((datasetName, key) =>
        mySQLTables.push(datasetName.name)      
      );
      // console.log(mySQLTables);
      this.createOptions(mySQLTables);
    })
  }

  // GET METHOD CALL
  async callBackendAPI(url) {
    const response = await fetch(url);
    const body = await response.json();
    if (response.status !== 200) {
      throw Error(body.message);
    }
    return body;
  }   

  //creating select options for drop down list based on data from flask
  createOptions(data) {
    let options = [];
    if (data.toString().replace(/\s/g, '').length) { //checking data is not empty       
      var mySQLTables = data.toString().split(",");
      for (let i = 0; i < mySQLTables.length; i++) {
        if(mySQLTables[i].includes("_tweets_w_sentiment")){
          
        } else if(mySQLTables[i].includes("_tweets")){
          options.push(<option value={mySQLTables[i]}>{mySQLTables[i]}</option>);          
        }
      };
    }

    this.setState({
      options: options    
    });
  }    

  //store the variable that the user has selected
  selectTable(event) {
    this.setState({
      selectedtable: event.target.value
    });      
  }

  //this will train the models
  trainModel(event) {
    this.setState({
      hideLoadingBar: false
    });      
    $.post(window.location.origin + "/twittertrain/",
    {
      selectedtable: this.state.selectedtable   
    },
    (data) => {
      this.setState({
        hideLoadingBar: true //hide loading button             
      })      
    });    
  }  

  //creating bar chart using plotly
  barChart(yData){
    this.setState({
      barchart: <Plot data={[{
                  x: ['Positive','Negative'],
                  y: yData,
                  type: 'bar',
                  marker:{
                    color: ['rgba(123, 239, 178, 1)', 'rgba(222, 45, 38, 0.8)']
                  },
                  name: 'Positive vs Negative Tweets',
                  hoverlabel: {namelength: -1}
                  }]}
                  layout={{
                    width: 600, 
                    height: 500, 
                    title: '<b>Positive vs Negative Tweets</b>',
                    hovermode: 'closest',
                    xaxis: {
                      title: 'Sentiments',
                      ticklen: 5,
                      zeroline: false,
                      gridwidth: 2,
                    },
                    yaxis: {
                      title: 'No. of Tweets',
                      ticklen: 5,
                      zeroline: false,
                      gridwidth: 2,
                    }                          
                  }}
                />
      })
  }

  //retrieving chart data from flask and creating chart using plotly
  generatePlot(event){
    $.post(window.location.origin + "/generateplotbi/",
    {
      selectedtable: this.state.selectedtable   
    },
    (data) => {
      this.barChart(data['aggregatedsentiment']);

      var x = document.getElementById("message");
      x.style.display = "none";

      var x = document.getElementById("message2");
      x.style.display = "none";

      var x = document.getElementById("message3");
      x.style.display = "none";

      this.setState({                  
        columns: data['columns'],
        values: data['values'],
        topiccolumns: data['topiccolumns'],
        topicvalues: data['topicvalues'],
        topicvalues2: data['topicvalues2'],
        topicvalues3: data['topicvalues3'],
        hideLoadingBar: true, //hide loading button
        tableboolean: true,
        tableboolean2: true,
        tablename: this.state.selectedtable                     
      });
      this.generateWordCloud(); 
    });  
  }

  generateWordCloud(){
    let textdataPositive = [];
    let textdataNegative = [];
      // {text:'first',value:200},
      // {text:'second',value:100},

    let topicvalues2 = this.state.topicvalues2
    let topicvalues3 = this.state.topicvalues3;
    
    for (let i = 0; i < topicvalues2.length; i++) {
      let topicvalues2words = topicvalues2[i][1];
      let words = topicvalues2words.split(',');
      for (let k = 0; k < words.length; k++) {
        textdataPositive.push({'text':words[k],'value':200});
      }
    }

    for (let i = 0; i < topicvalues3.length; i++) {
      let topicvalues3words = topicvalues3[i][1];
      let words = topicvalues3words.split(',');
      for (let k = 0; k < words.length; k++) {
        textdataNegative.push({'text':words[k],'value':200});
      }
    }

    this.setState({
      textdataPositive: textdataPositive,
      textdataNegative: textdataNegative
    })
  }      

  //handle form submission
  formSubmitted(event){
    event.preventDefault();

    this.setState({
      hideLoadingBar: false
    });  

    this.generatePlot();   
  }  

   //rendering the html for chart
   render() {
      const style = this.state.hideLoadingBar ? {display: 'none'} : {};

      return (
        <div>
          {/*uncomment below to train model*/}
          {/*<button id="submitbutton" onClick={this.trainModel} className="button" type="button" style={{"verticalAlign":"middle"}}>Train Model</button>*/}
          <div className="content">
          <table style={{"width":"100%"}}>
          <tbody>
            <tr>
              <td style={{"width":"22%", "height":"240px", "boxShadow":"0 4px 8px 0 rgba(0,0,0,0.2)", "borderRadius":"12px"}} valign="top" align="center" bgcolor="white">   
              <form name="submitForm" method="POST" onSubmit={this.formSubmitted}>                       
                <br />
                <table align="center">
                <tbody>
                  <tr>
                  <td align="center">
                    <div className="cardtitle">
                      Select Dataset
                    </div>
                  </td>
                  </tr><tr>
                  <td align="center">
                    <div className="cardsubtitle">
                      Dataset:
                    </div>
                  </td>
                  </tr><tr>
                  <td align="center">
                    <select required defaultValue="" onChange={this.selectTable} style={{"width":"210px"}}>
                      <option value="" disabled>---------- select a dataset ----------</option>
                      {this.state.options}
                    </select>
                  </td>
                  </tr><tr>
                  </tr><tr>
                  </tr><tr>                      
                  <td align="center">                                                                              
                    <button id="submitbutton" className="button" type="submit" style={{"verticalAlign":"middle"}}>Generate Analysis</button>                             
                  </td>
                  </tr><tr>              
                  <td align="center">                                                            
                    <div className="LoadingBar" style={style}>
                      {this.loadingBarInstance}
                    </div>                                
                  </td>
                  </tr>                                 
                </tbody>   
                </table>
                <br/>          
              </form>
              </td>                            
            </tr>
          </tbody>   
          </table>
          
          <table style={{"width":"100%"}}>
          <tbody>                       
            <tr></tr>
            <tr>
              <td align="center" style={{"width":"80%", "boxShadow":"0 4px 8px 0 rgba(0,0,0,0.2)", "borderRadius":"12px", "padding":"10px"}} bgcolor="white">
              <table id="message">
              <tbody>
                <tr>
                <td align="center" style={{"width":"1000px", "height":"580px", "borderRadius":"12px", "padding":"10px"}} bgcolor="#FAFAFA">
                  <label style={{"verticalAlign":"center"}}>Plot Display Area</label>          
                </td>                           
                </tr>
              </tbody>   
              </table> 
              <table>
              <tbody>  
                <tr>
                  <td>        
                    {this.state.barchart}
                  </td>
                  <td align="center" style={{"overflow":"auto", "maxWidth":"600", "verticalAlign":"top", "align":"center"}}>    
                    <div style={{"overflowX":"auto"}}>
                      <div className="outputtable" style={{"width":"600","maxWidth":"600"}}>
                        {this.state.tableboolean2?(                 
                          <MUIDataTable
                             title={"Topic Analysis"}
                             data={this.state.topicvalues}
                             columns={this.state.topiccolumns}
                          /> 
                          ):null
                        } 
                      </div> 
                    </div>
                  </td>                     
                </tr>
              </tbody>   
              </table>                  
              </td>          
            </tr>
          </tbody>   
          </table>  
          </div>

          <table style={{"width":"100%"}}>
          <tbody>                       
            <tr></tr>
            <tr>
              <td align="center" style={{"width":"80%", "boxShadow":"0 4px 8px 0 rgba(0,0,0,0.2)", "borderRadius":"12px", "padding":"10px"}} bgcolor="white">
              <table id="message3">
              <tbody>
                <tr>
                <td align="center" style={{"width":"1000px", "height":"580px", "borderRadius":"12px", "padding":"10px"}} bgcolor="#FAFAFA">
                  <label style={{"verticalAlign":"center"}}>Word Cloud Display Area</label>          
                </td>                           
                </tr>
              </tbody>   
              </table> 
              <table>
              <tbody>  
                <tr>
                  <td align="center">   
                    <h1>
                      <span style={{"color":"#4CAF50"}}>Positive Keywords</span> in Tweets
                    </h1>     
                    <br/>
                    <WordCloud
                      data={this.state.textdataPositive}
                      fontSizeMapper={this.state.fontSizeMapper}
                      rotate={this.state.rotate}
                    />
                  </td>  
                  <td align="center">    
                     <h1>
                      <span style={{"color":"red"}}>Negative Keywords</span> in Tweets
                    </h1>
                    <br/>
                    <WordCloud
                      data={this.state.textdataNegative}
                      fontSizeMapper={this.state.fontSizeMapper}
                      rotate={this.state.rotate}
                    />
                  </td>            
                </tr>
              </tbody>   
              </table>                  
              </td>          
            </tr>
          </tbody>   
          </table>  

          <table>
          <tbody>
            <tr>
              <td style={{"width":"22%", "boxShadow":"0 4px 8px 0 rgba(0,0,0,0.2)", "paddingTop":"15px", "paddingBottom":"15px", "borderRadius":"12px"}} valign="top" align="center" bgcolor="white">   
                <div style={{"overflowX":"auto"}}>
                  <table id="message2">
                    <tbody>
                      <tr>
                        <td align="center" style={{"width":"1000px", "height":"580px", "borderRadius":"12px", "padding":"10px"}} bgcolor="#FAFAFA">
                          <label style={{"verticalAlign":"center"}}>Dataset Display Area</label>                                                     
                        </td>                           
                      </tr>
                     </tbody>
                  </table>    
                  <div className="outputtable" style={{"width":"1000px","maxWidth":"1100px"}}>
                    {this.state.tableboolean?(                 
                      <MUIDataTable
                         title={"Dataset: "+this.state.tablename}
                         data={this.state.values}
                         columns={this.state.columns}
                      /> 
                      ):null
                    } 
                  </div> 
                </div>
              </td>
            </tr>
          </tbody>
          </table>                            
        </div>
      );
   }
}
export default Analysisbi;