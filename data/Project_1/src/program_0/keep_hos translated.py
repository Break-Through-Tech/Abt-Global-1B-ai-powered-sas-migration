def keep_hos(df, varlist, nmeasure):
    
    # SAS: set &indsn;
    # Create a copy of the original hospital dataset
    df = df.copy()

    # SAS: array M(&nmeasure.) &varlist.;
    # Select the columns corresponding to the included measures
    M = df[varlist]

    # SAS: array C(1:&nmeasure.) C1-C&nmeasure.;
    # Create names for temporary indicator columns (C1, C2, ...)
    C = [f'C{k}' for k in range(1, nmeasure + 1)]

    # SAS: DO k = 1 TO &nmeasure.;
    # Loop through each included measure
    for k in range(1, nmeasure + 1):
        
        # SAS: if m[k] ^=. then C[k]=1; else C[k]=0;
        # Assign 1 if the hospital has a non-missing value
        # for the measure, or 0 if the value is missing
        df[C[k - 1]] = df[M.columns[k - 1]].notna().astype(int)

    # SAS: Total_m_cnt=sum(of c1-c&nmeasure.);
    # Count the number of non-missing measures for each hospital
    df['Total_m_cnt'] = df[C].sum(axis=1)

    # SAS: where=(Total_m_cnt>=1)
    # Remove hospitals with no available included measures
    df = df[df['Total_m_cnt'] >= 1]

    # SAS: drop=c1-c&nmeasure. k
    # Remove temporary indicator columns, keeping Total_m_cnt
    df = df.drop(columns=C)

    # Return the filtered hospital dataset
    return df
