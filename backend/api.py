import time
import urllib.request
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Set
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
available_countries: List[str]
available_countries_set: Set[str]
last_update: datetime = None


def calculate_data():
    def convert(df: pd.DataFrame):
        df = df[df["Province/State"].isna()]
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

    global available_countries, available_countries_set
    available_countries = list(df_cases.columns.values)
    available_countries_set = set(available_countries)

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


def format_date(date: datetime):
    return date.strftime('%Y-%m-%d')


def convert_to_result(series: pd.Series):
    return {
        "r": [
            {
                "d": format_date(date),
                "v": round(value, 1) if not np.isnan(value) else None
            } for date, value in series.iteritems()
        ]
    }


def error(error_message: str):
    return {
        "r": None,
        "e": error_message
    }


def country_not_available(country_name: str):
    return error(f'No data available for country "{country_name}"')


def no_type():
    return error("No type specified")


def illegal_type(type: str):
    return error(f'Illegal type "{type}"')


@app.route('/country/<country_name>/')
@cross_origin()
def country(country_name: str):
    if country_name not in available_countries_set:
        return country_not_available(country_name)

    type = request.args.get("type")
    if type is None:
        return no_type()

    series: pd.Series
    if type == "cases":
        series = df_new_cases[country_name]
    elif type == "deaths":
        series = df_new_deaths[country_name]
    elif type == "growth":
        series = df_growth[country_name]
    elif type == "inzidenz":
        df_inzidenz = (df_cases - df_cases.shift(7)) / population_map[country_name] * 100_000
        series = df_inzidenz[country_name]
    else:
        return illegal_type(type)

    return convert_to_result(series)


@app.route('/countries/')
@cross_origin()
def countries():
    return {
        'countries': available_countries
    }


@app.route('/update')
@cross_origin()
def update():
    update_time = download()
    return {'updateTime': update_time.isoformat()}


def download():
    global last_update
    now = datetime.now()
    if last_update is not None and (now - last_update) < timedelta(hours=3):
        return last_update
    print("Downloading new data")
    urllib.request.urlretrieve(
        "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv",
        "countries_cases.csv"
    )

    urllib.request.urlretrieve(
        "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv",
        "countries_deaths.csv"
    )

    # urllib.request.urlretrieve(
    #    "https://opendata.arcgis.com/datasets/dd4580c810204019a7b8eb3e0b329dd6_0.csv",
    #    "germany.csv"
    # )
    calculate_data()

    last_update = now
    return now


download()
