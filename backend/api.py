import time
import urllib.request
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
from scipy.stats.mstats import gmean
from datetime import datetime, timedelta

from flask import Flask, request
from flask_cors import CORS, cross_origin

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

cache: Dict[int, List[Tuple[str, float]]] = dict()

population_map = {
    "germany": 83_020_000
}
df_cases: pd.DataFrame
last_update: datetime = None


def calculate_data():
    def convert(df: pd.DataFrame):
        df = df[df["Province/State"].isna()]
        print(df)
        df = df.T
        df = df.drop(["Province/State", "Lat", "Long"], 0)
        df.columns = df.iloc[0]
        df = df.drop("Country/Region", 0)
        df.index = pd.to_datetime(df.index)
        df = df.astype('float64')
        return df

    global df_cases
    df_cases = convert(pd.read_csv("countries_cases.csv"))
    df_deaths = convert(pd.read_csv("countries_deaths.csv"))

    def daily_change(df: pd.DataFrame):
        return df - df.shift(1)

    df_new_cases_raw = daily_change(df_cases)
    df_new_deaths_raw = daily_change(df_deaths)

    def relative_change_since_last_week(current: pd.DataFrame):
        last_week = current.shift(7)
        relative_change = current / last_week.replace(0, np.nan)
        return relative_change.interpolate()

    global df_new_cases, df_new_deaths, df_growth
    df_new_cases = df_new_cases_raw.rolling(7).mean().shift(-3)
    df_new_deaths = df_new_deaths_raw.rolling(7).mean().shift(-3)

    df_relative_new_cases_per_day = relative_change_since_last_week(df_new_cases) ** (1 / 7)
    df_growth = df_relative_new_cases_per_day.rolling(7).apply(gmean).shift(-3).rolling(3, win_type='gaussian').mean(
        std=1).shift(-1).subtract(1).multiply(100)


@app.route('/api/country/<country_name>/')
@cross_origin()
def country(country_name: str):
    type = request.args.get("type")
    if type is None:
        return {
            "country": country_name,
        }

    result = []
    if type == "cases":
        return {
            "result": [{
                "date": date.isoformat(),
                "value": value if not np.isnan(value) else None
            } for date, value in df_new_cases[country_name].iteritems()]
        }
    elif type == "deaths":
        return {
            "result": [{
                "date": date.isoformat(),
                "value": value if not np.isnan(value) else None
            } for date, value in df_new_deaths[country_name].iteritems()]
        }
    elif type == "growth":
        return {
            "result": [{
                "date": date.isoformat(),
                "value": value if not np.isnan(value) else None
            } for date, value in
                df_growth[country_name].iteritems()]
        }
    elif type == "inzidenz":
        df_inzidenz = (df_cases - df_cases.shift(7)) / population_map[country_name] * 100_000
        return {
            "result": [{
                "date": date.isoformat(),
                "value": value if not np.isnan(value) else None
            } for date, value in
                df_inzidenz[country_name].iteritems()]
        }


@app.route('/api/countries/')
@cross_origin()
def countries():
    return {
        'countries': list(df_cases.columns.values)
    }


@app.route('/api/update')
@cross_origin()
def update():
    download()


def download():
    global last_update
    now = datetime.now()
    if last_update is not None and (now - last_update) < timedelta(hours=3):
        return
    print("Downloading new data")
    urllib.request.urlretrieve(
        "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv",
        "countries_cases.csv"
    )

    urllib.request.urlretrieve(
        "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv",
        "countries_deaths.csv"
    )

    urllib.request.urlretrieve(
        "https://opendata.arcgis.com/datasets/dd4580c810204019a7b8eb3e0b329dd6_0.csv",
        "germany.csv"
    )
    calculate_data()

    last_update = now
    return {'done': now.isoformat()}

download()