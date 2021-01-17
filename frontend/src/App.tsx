import React from 'react';
import './App.scss';
import { BrowserRouter as Router } from "react-router-dom";
import LineChart from './LineChart';
import GrowthChart from './GrowthChart';

enum GraphType {
  CASES = 'cases', DEATHS = 'deaths', GROWTH = 'growth'
}

type State = {
  data: { date: Date, value: number }[],
  loading: boolean,
  activeType: GraphType
  selectedType: GraphType,
  countries: string[],
  currentCountry: string
}

class App extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = {
      data: [],
      loading: false,
      activeType: GraphType.CASES,
      selectedType: GraphType.CASES,
      countries: ['Germany'],
      currentCountry: 'Germany'
    }
  }

  componentDidMount() {
    this.setTypeAndCountryAndDownload(this.state.currentCountry, this.state.selectedType)
    fetch(`/api/countries/`).then(
      res => {
        return res.json();
      }).then(response => {
      this.setState({ countries: response.countries })
    })
  }

  setTypeAndCountryAndDownload = (country: string, type: GraphType) => {
    this.setState({ loading: true, currentCountry: country, selectedType: type })
    fetch(`/api/country/${country}/?type=${type.valueOf()}`).then(
      res => {
        return res.json();
      }).then(response => {
      this.onDataLoaded(response.result, type)
    })
  }

  onDataLoaded(data: { date: string, value: number }[], type: GraphType) {
    this.setState({
      data: data.map((entry: { date: string, value: number }) => ({
        date: new Date(entry.date),
        value: entry.value
      })),
      loading: false,
      activeType: type
    })
  }

  handleTypeChange = (type: GraphType) => {
    this.setTypeAndCountryAndDownload(this.state.currentCountry, type)
  }

  handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const country = event.currentTarget.value
    this.setTypeAndCountryAndDownload(country, this.state.selectedType)
  }

  render() {
    return (
      <Router>
        <div className="App">
          <main>
            <div className="controls">
              <div className="country-select-wrapper">
                <select className="country-select"
                        onChange={this.handleCountryChange}
                        value={this.state.currentCountry}>
                  {this.state.countries.map((country, index) => <option key={`${index}-${country}`}
                                                                        value={country}>{country}</option>)}
                </select>
              </div>
              <div className="type-buttons">
                <button onClick={() => this.handleTypeChange(GraphType.CASES)}
                        className={this.state.selectedType === GraphType.CASES ? "active" : undefined}>
                  Cases
                </button>
                <button onClick={() => this.handleTypeChange(GraphType.DEATHS)}
                        className={this.state.selectedType === GraphType.DEATHS ? "active" : undefined}>
                  Deaths
                </button>
                <button onClick={() => this.handleTypeChange(GraphType.GROWTH)}
                        className={this.state.selectedType === GraphType.GROWTH ? "active" : undefined}>
                  Growth
                </button>
              </div>
            </div>
            <div className="chart-wrapper">
              <div className="chart">
                {this.state.data.length > 1 ?
                  (this.state.activeType !== GraphType.GROWTH ?
                    (this.state.activeType === GraphType.CASES ?
                      <LineChart data={this.state.data.filter(({ value }) => value !== null)}
                                 margin={{ top: 20, left: 50, right: 30, bottom: 30 }}
                                 areaColor={"#48a59c"}
                                 lineColor={'#E0F2F1'}
                      /> : <LineChart data={this.state.data.filter(({ value }) => value !== null)}
                                      margin={{ top: 20, left: 50, right: 30, bottom: 30 }}
                                      areaColor={"#b3423b"}
                                      lineColor={'#FFEBEE'}
                      />)
                    : <GrowthChart data={this.state.data.filter(({ value }) => value !== null)}
                                   margin={{ top: 20, left: 50, right: 30, bottom: 30 }}
                    />) : null}
              </div>
            </div>
          </main>
        </div>
      </Router>
    );
  }
}

export default App;
