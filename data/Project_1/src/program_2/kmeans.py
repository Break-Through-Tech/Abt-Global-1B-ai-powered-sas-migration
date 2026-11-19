# SAS SOURCE: 2 - Second Stage...sas (lines 134–191) & Star_Macros.sas (%kmeans, lines 157–238)

from pathlib import Path
import numpy as np
import pandas as pd

PROJECT_DIR = Path(__file__).resolve().parents[2]
OUT_DIR = PROJECT_DIR / "Python Output CSV" / "program_2"

PEER_GROUPS = [
    "1) # of groups=3       ",
    "2) # of groups=4       ",
    "3) # of groups=5       ",
]


def _quintile_median_seeds(scores: np.ndarray) -> np.ndarray:
    """Find the 5 starting centers: split scores into 5 quintiles and take each median.

    Uses 'averaged_inverted_cdf' to match SAS PROC UNIVARIATE default (PCTLDEF=5).
    """
    p20, p40, p60, p80 = np.quantile(
        scores, [0.20, 0.40, 0.60, 0.80], method="averaged_inverted_cdf"
    )

    grp = np.zeros(len(scores), dtype=int)
    grp[scores <= p20] = 1
    grp[(scores > p20) & (scores <= p40)] = 2
    grp[(scores > p40) & (scores <= p60)] = 3
    grp[(scores > p60) & (scores <= p80)] = 4
    grp[scores > p80] = 5

    return np.array([np.median(scores[grp == g]) for g in range(1, 6)], dtype=float)


def _fastclus_1d(
    scores: np.ndarray,
    init_seeds: np.ndarray,
    maxiter: int = 1000,
    strict: float | None = None,
) -> tuple[np.ndarray, np.ndarray]:
    """1D K-means matching SAS PROC FASTCLUS (MAXC=5, CONVERGE=0, optional STRICT=1)."""
    seeds = init_seeds.astype(float).copy()
    k = len(seeds)

    for _ in range(maxiter):
        dists = np.abs(scores[:, None] - seeds[None, :])
        nearest = np.argmin(dists, axis=1)
        min_dists = dists[np.arange(len(scores)), nearest]

        # If strict=1.0, ignore points farther than 1.0 when updating cluster averages
        active = (min_dists <= strict) if strict is not None else np.ones(len(scores), dtype=bool)

        new_seeds = seeds.copy()
        for c in range(k):
            members = scores[(nearest == c) & active]
            if len(members) > 0:
                new_seeds[c] = np.mean(members)

        # CONVERGE=0: stop once centers no longer move
        if np.array_equal(new_seeds, seeds):
            break
        seeds = new_seeds

    # Final step: assign every hospital (including >1.0 outliers) to its closest center
    final_clusters = np.argmin(np.abs(scores[:, None] - seeds[None, :]), axis=1)
    return final_clusters, seeds


def kmeans_peer_group(in_df: pd.DataFrame, grp_col: str = "cnt_grp") -> pd.DataFrame:
    """SAS equivalent of %kmeans macro for a single peer group."""
    df = in_df.copy()
    scores = df["summary_score"].to_numpy(dtype=float)

    # Pass 1: quintile median seeds -> normal K-means
    seeds1 = _quintile_median_seeds(scores)
    _, seeds2 = _fastclus_1d(scores, seeds1, maxiter=1000, strict=None)

    # Pass 2: Pass 1 centers -> outlier-safe K-means (strict=1)
    clusters, final_centers = _fastclus_1d(scores, seeds2, maxiter=1000, strict=1.0)

    # Sort centers lowest -> highest and map to 1..5 stars
    order = np.argsort(final_centers)
    cluster_to_star = {cluster_idx: rank + 1 for rank, cluster_idx in enumerate(order)}

    df["star"] = pd.Series(clusters, index=df.index).map(cluster_to_star).astype("Int64")
    return df[["PROVIDER_ID", "star", grp_col]].sort_values("PROVIDER_ID").reset_index(drop=True)


def compute_star_ratings(
    summary_score21: pd.DataFrame,
    summary_score22: pd.DataFrame,
) -> pd.DataFrame:
    """SAS equivalent of lines 134–191.

    Runs %kmeans on each of the 3 peer groups and merges star + cnt_grp
    back onto summary_score21.
    """
    peer_results = []
    for grp_label in PEER_GROUPS:
        subset = summary_score22.loc[summary_score22["cnt_grp"] == grp_label].copy()
        if not subset.empty:
            peer_results.append(kmeans_peer_group(subset, grp_col="cnt_grp"))

    cnt_s_str = (
        pd.concat(peer_results, ignore_index=True)
        .sort_values("PROVIDER_ID")
        .reset_index(drop=True)
    )

    results = (
        summary_score21.sort_values("PROVIDER_ID")
        .merge(cnt_s_str, on="PROVIDER_ID", how="left")
        .sort_values("PROVIDER_ID")
        .reset_index(drop=True)
    )
    return results


if __name__ == "__main__":
    # Chains all 4 earlier modules cleanly without duplicating any logic
    from loader import load_and_merge_domain_data
    from peer_groups import assign_peer_groups, merge_summary_and_report
    from report import load_analysis_data, report
    from summary_score import compute_summary_score

    summary_df = compute_summary_score(load_and_merge_domain_data())
    report_df = report(load_analysis_data())

    summary_score21 = merge_summary_and_report(summary_df, report_df)
    summary_score22 = assign_peer_groups(summary_score21)
    star_df = compute_star_ratings(summary_score21, summary_score22)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUT_DIR / "STAR_2025JUL.csv"
    star_df.to_csv(out_file, index=False)

    rated = int(star_df["star"].notna().sum())
    print(f"Processed {star_df.shape[0]} rows ({rated} assigned 1–5 stars). Saved to {out_file}")
