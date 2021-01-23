import React from 'react';
import './App.scss';
import { BrowserRouter as Router } from "react-router-dom";
import LineChart from './LineChart';
import GrowthChart from './GrowthChart';
import { config } from './Constants';

enum GraphType {
  CASES = 'cases', DEATHS = 'deaths', GROWTH = 'growth'
}

enum Theme {
  AUTO = 'auto', DARK = 'dark', LIGHT = 'light'
}

type DataEntry = { date: Date, value: number | null }

type State = {
  data: DataEntry[],
  loading: boolean,
  activeType: GraphType
  selectedType: GraphType,
  countries: string[],
  currentCountry: string,
  logScale: boolean,
  theme: Theme
}

class App extends React.Component<{}, State> {

  cache = new Map<string, { data: DataEntry[], date: number }>()
  CACHE_THRESHOLD = 600_000

  constructor(props: {}) {
    super(props);

    const theme = (localStorage.getItem("theme-mode") ?? 'auto') as Theme

    this.state = {
      data: [],
      loading: false,
      activeType: GraphType.CASES,
      selectedType: GraphType.CASES,
      countries: ['Germany'],
      currentCountry: 'Germany',
      logScale: false,
      theme: theme
    }
  }

  computeKey(country: string, type: GraphType) {
    return `${country},${type.valueOf()}`
  }

  updateTheme() {
    document.body.classList.toggle("dark-theme", this.state.theme === Theme.DARK)
    document.body.classList.toggle("light-theme", this.state.theme === Theme.LIGHT)
    localStorage.setItem("theme-mode", this.state.theme.valueOf())
  }

  componentDidMount() {
    this.updateCountryAndType(this.state.currentCountry, this.state.selectedType)
    fetch(`${config.apiUrl}/countries/`).then(
      res => {
        return res.json();
      }).then(response => {
      this.setState({ countries: response.countries })
    })
    this.updateTheme()
  }

  componentDidUpdate() {
    this.updateTheme()
  }

  updateCountryAndType = (country: string, type: GraphType) => {
    this.setState({ loading: true, currentCountry: country, selectedType: type })
    const key = this.computeKey(country, type)
    if (!this.cache.has(key) ||
      Date.now() - this.cache.get(key)!.date > this.CACHE_THRESHOLD) {
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
      const result: { d: string, v: number | null }[] = response.r
      const data = result.map(({ d: date, v: value }) => ({ date: new Date(date), value }))
      this.cache.set(this.computeKey(country, type), { data, date: Date.now() })
      this.updateDataInState(data, country, type)
    })
  }

  updateDataInState(data: DataEntry[], country: string, type: GraphType) {
    this.setState({
      data: data.map(({ date, value }) => ({
        date: date,
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

  handleLogScaleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ logScale: event.currentTarget.checked })
  }

  handleThemeAutoChange = (_: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ theme: Theme.AUTO })
  }

  handleThemeDarkChange = (_: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ theme: Theme.DARK })
  }

  handleThemeLightChange = (_: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ theme: Theme.LIGHT })
  }

  render() {
    return (
      <Router>
        <div className="App">
          <main>
            <div className="graph-content">
              <div className="controls">
                <div className="country-select-wrapper">
                  <select className="country-select"
                          onChange={this.handleCountryChange}
                          value={this.state.currentCountry}>
                    {this.state.countries.map((country, index) => <option
                      key={`${index}-${country}`}
                      value={country}>{country}</option>)}
                  </select>
                </div>
                <div className="type-buttons">
                  <button onClick={() => this.handleTypeChange(GraphType.CASES)}
                          className={this.state.selectedType === GraphType.CASES ? "active" : undefined}>
                    Infections
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
                        <LineChart
                          data={this.state.data.filter(({ value }) => value !== null) as { date: Date, value: number }[]}
                          margin={{ top: 20, left: 50, right: 30, bottom: 30 }}
                          areaColor={"var(--cases-area-color)"}
                          lineColor={'var(--cases-line-color)'}
                          logScale={this.state.logScale}
                        /> : <LineChart
                          data={this.state.data.filter(({ value }) => value !== null) as { date: Date, value: number }[]}
                          margin={{ top: 20, left: 50, right: 30, bottom: 30 }}
                          areaColor={"var(--death-area-color)"}
                          lineColor={'var(--death-line-color)'}
                          logScale={this.state.logScale}
                        />)
                      : <GrowthChart
                        data={this.state.data.filter(({ value }) => value !== null) as { date: Date, value: number }[]}
                        margin={{ top: 20, left: 50, right: 30, bottom: 30 }}
                      />) : null}
                </div>
              </div>
              <div className="bottom-controls">
                {this.state.selectedType !== GraphType.GROWTH ?
                  <div className="checkbox-wrapper">
                    <input type="checkbox" id="log-scale" checked={this.state.logScale}
                           onChange={this.handleLogScaleChange}/>
                    <label htmlFor="log-scale">
                      Log scale
                    </label>
                  </div> : <div/>
                }
                <div className="theme-wrapper">
                  <div className="checkbox-wrapper">
                    <input type="checkbox" id="theme-auto" checked={this.state.theme === Theme.AUTO}
                           onChange={this.handleThemeAutoChange}/>
                    <label htmlFor="theme-auto">Auto</label>
                  </div>
                  <div className="checkbox-wrapper">
                    <input type="checkbox" id="theme-dark" checked={this.state.theme === Theme.DARK}
                           onChange={this.handleThemeDarkChange}/>
                    <label htmlFor="theme-dark">Dark</label>
                  </div>
                  <div className="checkbox-wrapper">
                    <input type="checkbox" id="theme-light"
                           checked={this.state.theme === Theme.LIGHT}
                           onChange={this.handleThemeLightChange}/>
                    <label htmlFor="theme-light">Light</label>
                  </div>
                </div>
              </div>
            </div>
            <div className="explanation">
              <h2>Explanation</h2>
              <p>You are currently seeing {this.state.selectedType === GraphType.CASES ?
                "the number of new infections per day" :
                this.state.selectedType === GraphType.DEATHS ? "the number of new deaths per day" :
                  "the daily relative growth of the number of new infections (in %)"}.
              A seven day running average has been applied to all data to make the graph more meaningful.</p>
              <p>Data source is the <a target="_blank" rel="noopener noreferrer" href="https://github.com/CSSEGISandData/COVID-19">John Hopkins University</a>.</p>
            </div>
          </main>
        </div>
      </Router>
    );
  }
}

export default App;
