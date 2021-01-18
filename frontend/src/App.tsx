import React from 'react';
import './App.scss';
import { BrowserRouter as Router } from "react-router-dom";
import LineChart from './LineChart';
import GrowthChart from './GrowthChart';
import { config } from './Constants';

enum GraphType {
  CASES = 'cases', DEATHS = 'deaths', GROWTH = 'growth'
}

enum ThemeMode {
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
  themeMode: ThemeMode
}

class App extends React.Component<{}, State> {

  cache = new Map<string, { data: DataEntry[], date: number }>()
  CACHE_THRESHOLD = 600_000

  constructor(props: {}) {
    super(props);

    const themeMode = (localStorage.getItem("theme-mode") || 'auto') as ThemeMode

    this.state = {
      data: [],
      loading: false,
      activeType: GraphType.CASES,
      selectedType: GraphType.CASES,
      countries: ['Germany'],
      currentCountry: 'Germany',
      logScale: false,
      themeMode
    }
  }

  computeKey(country: string, type: GraphType) {
    return `${country},${type.valueOf()}`
  }

  updateTheme() {
    document.body.classList.toggle("dark-theme", this.state.themeMode === ThemeMode.DARK)
    document.body.classList.toggle("light-theme", this.state.themeMode === ThemeMode.LIGHT)
    localStorage.setItem("theme-mode", this.state.themeMode)
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

  handleThemeModeAutoChange = (_: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ themeMode: ThemeMode.AUTO })
  }

  handleThemeModeDarkChange = (_: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ themeMode: ThemeMode.DARK })
  }

  handleThemeModeLightChange = (_: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ themeMode: ThemeMode.LIGHT })
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
              <div className="checkbox-wrapper">
                <input type="checkbox" id="log-scale" checked={this.state.logScale}
                       onChange={this.handleLogScaleChange}/>
                <label htmlFor="log-scale">
                  Log scale
                </label>
              </div>
              <div className="theme-wrapper">
                <div className="checkbox-wrapper">
                  <input type="checkbox" id="theme-auto" checked={this.state.themeMode === ThemeMode.AUTO}
                        onChange={this.handleThemeModeAutoChange}/>
                  <label htmlFor="theme-auto">Auto</label>
                </div>
                <div className="checkbox-wrapper">
                  <input type="checkbox" id="theme-dark" checked={this.state.themeMode === ThemeMode.DARK}
                        onChange={this.handleThemeModeDarkChange}/>
                  <label htmlFor="theme-dark">Dark</label>
                </div>
                <div className="checkbox-wrapper">
                  <input type="checkbox" id="theme-light" checked={this.state.themeMode === ThemeMode.LIGHT}
                        onChange={this.handleThemeModeLightChange}/>
                  <label htmlFor="theme-light">Light</label>
                </div>
              </div>
            </div>
          </main>
        </div>
      </Router>
    );
  }
}

export default App;
