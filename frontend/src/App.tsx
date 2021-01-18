import React from 'react';
import './App.scss';
import { BrowserRouter as Router } from "react-router-dom";
import LineChart from './LineChart';
import GrowthChart from './GrowthChart';
import { config } from './Constants';

enum GraphType {
  CASES = 'cases', DEATHS = 'deaths', GROWTH = 'growth'
}

type DataEntry = { date: Date, value: number }

type State = {
  data: DataEntry[],
  loading: boolean,
  activeType: GraphType
  selectedType: GraphType,
  countries: string[],
  currentCountry: string
}

class App extends React.Component<{}, State> {

  cache = new Map<string, { data: DataEntry[], date: number }>()
  CACHE_THRESHOLD = 600_000

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

  computeKey(country: string, type: GraphType) {
    return `${country},${type.valueOf()}`
  }

  componentDidMount() {
    console.log(`API: ${config.apiUrl}`)
    this.updateCountryAndType(this.state.currentCountry, this.state.selectedType)
    fetch(`${config.apiUrl}/countries/`).then(
      res => {
        return res.json();
      }).then(response => {
      this.setState({ countries: response.countries })
    })
  }

  updateCountryAndType = (country: string, type: GraphType) => {
    this.setState({ loading: true, currentCountry: country, selectedType: type })
    const key = this.computeKey(country, type)
    if (!this.cache.has(key) ||
      Date.now() - this.cache.get(key)!.date > this.CACHE_THRESHOLD) {
      console.log(this.cache)
      this.downloadData(country, type)
    } else {
      const { data } = this.cache.get(key)!
      this.updateDataInState(data, country, type)
    }
  }

  downloadData = (country: string, type: GraphType) => {
    fetch(`${config.apiUrl}/country/${country}/?type=${type.valueOf()}`).then(
      res => {
        return res.json();
      }).then(response => {
      const data = response.result
      this.cache.set(this.computeKey(country, type), { data, date: Date.now() })
      this.updateDataInState(data, country, type)
    })
  }

  updateDataInState(data: DataEntry[], country: string, type: GraphType) {
    this.setState({
      data: data.map(({ date, value }) => ({
        date: new Date(date),
        value: value
      })),
      loading: false,
      activeType: type
    })
  }

  handleTypeChange = (type: GraphType) => {
    this.updateCountryAndType(this.state.currentCountry, type)
  }

  handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const country = event.currentTarget.value
    this.updateCountryAndType(country, this.state.selectedType)
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
                                 areaColor={"var(--cases-area-color)"}
                                 lineColor={'var(--cases-line-color)'}
                      /> : <LineChart data={this.state.data.filter(({ value }) => value !== null)}
                                      margin={{ top: 20, left: 50, right: 30, bottom: 30 }}
                                      areaColor={"var(--death-area-color)"}
                                      lineColor={'var(--death-line-color)'}
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
