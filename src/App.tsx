import * as React from 'react';
import './App.css';

import 'bootstrap/dist/css/bootstrap-theme.css';
import 'bootstrap/dist/css/bootstrap.css';
// tslint:disable-next-line
import axios from 'axios';
import { Button } from 'react-bootstrap';
import { Chart } from 'react-google-charts';

import { AsyncTypeahead } from 'react-bootstrap-typeahead';

import 'react-bootstrap-typeahead/css/Typeahead.css';

import logo from './logo.svg';

interface IAppState {
  isLoading: boolean;
  options: string[];
  flexItemsCount: number;
  dataArray: object[];
}

// const dummyData = [['Zeit', 'Produktion', 'Verbrauch', 'Batterie'],
// ['Jan', 165, 938, 0.4],
// ['Feb', 135, 1120, 0.2],
// ['Mar', 157, 1167, 0.7],
// ['Apr', 139, 1110, 0.4],
// ['Mai', 136, 691, 0.6],
// ['Jun', 136, 1500, 0.6],
// ['Jul', 157, 691, 0.9],
// ['Aug', 136, 100, 2.3],
// ['Sep', 800, 800, 4],
// ['Oct', 136, 1300, 0.6],
// ['Nov', 10, 2000, 1.6],
// ['Dez', 136, 691, 0.6]];

const dataSet = [
  { time: 0, production: 10, consumtion: 3, batteryLevel: 0, totalEnergyOverflow: 0, kWhBought: 0 },
  { time: 1, production: 10, consumtion: 20, batteryLevel: 0, totalEnergyOverflow: 0, kWhBought: 0 },
  { time: 2, production: 10, consumtion: 3, batteryLevel: 0, totalEnergyOverflow: 0, kWhBought: 0 },
  { time: 3, production: 10, consumtion: 3, batteryLevel: 0, totalEnergyOverflow: 0, kWhBought: 0 },
  { time: 4, production: 10, consumtion: 3, batteryLevel: 0, totalEnergyOverflow: 0, kWhBought: 0 },
];

const apiEndpoint: string = "https://api3.geo.admin.ch/1804191145/rest/services/ech/SearchServer?sr=2056&lang=en&type=featuresearch&features=ch.bfs.gebaeude_wohnungs_register&timeEnabled=false&timeStamps=&searchText="
class App extends React.Component<{}, IAppState> {
  constructor(props: any) {
    super(props);
    this.state = {
      dataArray: [],
      flexItemsCount: 1,
      isLoading: false,
      options: [],
    };

  }

  public componentDidMount() {
    this.calculate()
  }
  public calculateBatteryLevel(element, previousBatteryLevel) {
    element.batteryLevel = previousBatteryLevel;
    const totalEnergyOverflow: number = element.production - element.consumtion;
    if (totalEnergyOverflow >= 0) {
      // overflow positive, energy is saved to battery
      element.batteryLevel += totalEnergyOverflow;
    } else {
      // overflow negative, energy from battery or Kraftwerk is used      
      if (Math.abs(totalEnergyOverflow) < element.batteryLevel) {
        element.batteryLevel -= totalEnergyOverflow;
      } else {
        const diff = Math.abs(totalEnergyOverflow) - element.batteryLevel;
        element.batteryLevel = 0;
        element.kWhBought = diff;
      }
    }
    return element;
  }
  public calculate() {
    let previousBatteryLevel = 0;
    const resultingDataSet: any[][] = [];
    resultingDataSet.push(['Zeit', 'Produktion', 'Verbrauch', 'Batterie']);
    dataSet.forEach(element => {
      element = this.calculateBatteryLevel(element, previousBatteryLevel);
      resultingDataSet.push([element.time, element.production, element.consumtion, element.batteryLevel]);
      previousBatteryLevel = element.batteryLevel;
    });

    this.setState({ dataArray: resultingDataSet });
  }

  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to GEO-DO</h1>
        </header>
        <p className="App-intro">
          Search for your location first
        </p>


        <AsyncTypeahead
          placeholder="search your location"
          labelKey="search"
          isLoading={this.state.isLoading}
          onSearch={this.handleSearch}
          options={this.state.options}
          onChange={this.handleOnChange}
          delay={300}
          // tslint:disable-next-line jsx-no-lambda
          renderMenuItemChildren={(option, props) => (
            <span key={option.id}> {option} </span>
          )}
        />
        <h1>Solar Panels</h1>
        <Button onClick={this.handleAddFlexItem} value="add solar panel" >Add</Button>
        <Button onClick={this.handleRemoveFlexItem} value="remove solar panel" >Remove</Button>
        <div className="Flex-container">
          {this.renderSolarPanels()}
        </div>
        <Chart chartType={"ComboChart"}
          data={this.state.dataArray}
          width="100%" legend_toggle={true} options={{
            hAxis: { title: 'Month' },
            series: { 2: { type: 'line', targetAxisIndex: 1 } },
            seriesType: 'area',
            title: 'Verbrauchsprofil',
            vAxis: { title: 'Batterieladung' },
          }} />
      </div>
    );
  }

  private handleOnChange = (selected: string[]) => {
    console.log(selected.toString());
    this.makeAndHandleRequest(selected[0], false)
      // tslint:disable-next-line
      .then((result: string) => {
        if (result.indexOf("_") > 0) {
          result = result.substring(0, result.indexOf("_"));
        }
        console.log("found id in handleOnChange = " + result);
      });
  }
  private renderSolarPanels = () => {
    // tslint:disable-next-line
    let result: any = [];
    for (let i = 0; i < this.state.flexItemsCount; i++) {
      result.push(<div key={i} className="Flex-item">1qm</div>);
    }
    return result;
  }
  private handleAddFlexItem = () => {
    this.setState((prevState) => {
      return { flexItemsCount: prevState.flexItemsCount + 1 };
    });
  }

  private handleRemoveFlexItem = () => {
    this.setState((prevState) => {
      return { flexItemsCount: prevState.flexItemsCount - 1 };
    });
  }

  private handleSearch = (query: any) => {
    this.setState({ isLoading: true });

    this.makeAndHandleRequest(query, true)
      // tslint:disable-next-line
      .then((options) => {
        console.log("setting options in handleSearch = " + options);
        this.setState({
          isLoading: false,
          options,
        });
      });
  }

  private makeAndHandleRequest = (query: any, byLabel: boolean) => {
    // tslint:disable-next-line
    return axios.get(apiEndpoint + query).then((response) => {
      if (byLabel) {
        return response.data.results.map((res: any) => res.attrs.label)
      } else {
        return response.data.results[0].attrs.featureId;
      }
    }, (error) => {
      console.log(error);
    });
    // return new Promise((resolve, reject) => resolve({ "options": ["kai", "dominique"] }));
  };
}

export default App;
