def keep_hos(df, varlist, nmeasure):
    df = df.copy()

    M = df[varlist]
    C = [f'C{k}' for k in range(1, nmeasure + 1)]

    for k in range(1, nmeasure + 1):
        df[C[k - 1]] = df[M.columns[k - 1]].notna().astype(int)

    df['Total_m_cnt'] = df[C].sum(axis=1)
    df = df[df['Total_m_cnt'] >= 1]
    df = df.drop(columns=C)

    return df
