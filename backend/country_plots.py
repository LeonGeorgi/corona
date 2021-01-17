import pandas as pd
import numpy as np
from scipy.stats.mstats import gmean
from datetime import date
from pathlib import Path

population_map = {
    "Germany" : 83_020_000
}

def convert(df: pd.DataFrame):
    df = df.T.drop(["Province/State", "Lat", "Long"], 0)
    df.columns = df.iloc[0]
    df = df.drop("Country/Region", 0)
    df.index = pd.to_datetime(df.index)
    df = df.astype('float64')
    return df


def download_cases():
    df_cases = pd.read_csv(
        "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv")
    df_cases = convert(df_cases)
    return df_cases


def download_deaths():
    df_deaths = pd.read_csv(
        "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv")
    df_deaths = convert(df_deaths)
    return df_deaths


def relative_change_since_last_week(current: pd.DataFrame):
    last_week = current.shift(7)
    relative_change = current / last_week.replace(0, np.nan)
    return relative_change.interpolate()


def daily_change(df: pd.DataFrame):
    return df - df.shift(1)


def plot_inzidenz(df_cases, country):
    df_inzidenz = df_cases - df_cases.shift(7)
    (df_inzidenz[country] / population_map[country] * 100_000).loc['2020-03-01':]


def plot_growth(df_new_cases, country):
    df_relative_new_cases_per_week = relative_change_since_last_week(df_new_cases)
    df_relative_new_cases_per_day = df_relative_new_cases_per_week ** (1 / 7)
    df_relative_new_cases_per_day[country].rolling(7).apply(gmean).shift(-3).rolling(3, win_type='gaussian').mean(
        std=1).shift(-1).subtract(1).multiply(100).loc['2020-03-01':]

def plot_new_cases(df_new_cases: pd.DataFrame, country: str):
    df_new_cases.rolling(7).mean()[country].loc['2020-03-01':].shift(-3)


def plot_new_deaths(df_new_deaths, country):
    df_new_deaths.rolling(7).mean()[country].loc['2020-03-01':].shift(-3)


def generate_country_plots(country: str):
    df_cases = download_cases()
    df_deaths = download_deaths()

    df_new_cases = daily_change(df_cases)
    df_new_deaths = daily_change(df_deaths)

    plot_new_cases(df_new_cases, country)
    plot_new_deaths(df_new_deaths, country)
    plot_growth(df_new_cases, country)
    plot_inzidenz(df_cases, country)
