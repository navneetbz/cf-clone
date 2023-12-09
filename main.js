const inputForm = document.getElementById("form");
inputForm.addEventListener("submit", handleSubmit);
let username = "";
const api_url = "https://codeforces.com/api/";

let verdict = {};
let language = {};
let ratings = {};
let heatmap = {};
let tags = {}

let tried = new Set();
let solved = new Set();
let attempts = {};
let max_attempts = 0;
let max_attempted_problem = "";
let problem_solved_count = {};
let max_ac = 0;
let max_ac_problem_name = "";
let years = 0;

async function handleSubmit(e) {
  try {
    showLoader()
    hideContent()
    e.preventDefault();
    const inputBox = document.getElementById("username-input");
    username = inputBox.value;

    verdict = {};
    language = {};
    ratings = {};
    heatmap = {};
    tags = {}
    tried = new Set();
    solved = new Set();
    attempts = {};
    max_attempts = 0;
    max_attempted_problem = "";
    problem_solved_count = {};
    max_ac = 0;
    max_ac_problem_name = "";
    years = 0;
    /*
      1st api => `${api_url}user.status?handle=${username}`
      2nd api => `${api_url}user.rating?handle=${username}`
    */
    let [response, response2] = await Promise.all([
      await fetch(`${api_url}user.status?handle=${username}`),
      await fetch(`${api_url}user.rating?handle=${username}`),
    ]);
    response = await response.json();
    response2 = await response2.json();
    console.log("response2", response2);
    console.log(response);

    createUserContestStatsTable(response2);

    // LOOPING OVER THE SUBMISSIONS
    for (let i = 0; i < response.result.length; i++) {
      // TAKING ONE SUBMISSION INTO A VARIABLE
      const submission = response.result[i];
      // ADDING VERDICT KEYS TO THE GLOBAL VERDICT OBJECT
      if (verdict[submission.verdict] === undefined) {
        verdict[submission.verdict] = 1;
      } else {
        verdict[submission.verdict] += 1;
      }

      // CALCULATE LANGUAGE

      if (language[submission.programmingLanguage] === undefined) {
        language[submission.programmingLanguage] = 1;
      } else {
        language[submission.programmingLanguage] += 1;
      }


      if (submission.verdict === "OK") {
        for (let tag of submission.problem.tags) {
  
          if (tags[tag] === undefined) {
            tags[tag] = 1
          } else {
            tags[tag] += 1
          }
  
        }

      }

      if (ratings[submission.problem.rating] === undefined) {
        if (
          submission.problem.rating === "undefined" ||
          submission.problem.rating === undefined
        ) {
          submission.problem.rating = "3500+";
        }
        ratings[submission.problem.rating] = 1;
      } else {
        ratings[submission.problem.rating] += 1;
      }

      let contestId = submission.problem.contestId;
      let level = submission.problem.index;
      let name = submission.problem.name;

      let key = `${contestId}-${name}-${level}`;

      // STORING TRIED PROBLEM COUNT
      tried.add(key);
      // STORING ACCEPTED PROBLEM COUNT
      if (submission.verdict === "OK") {
        solved.add(key);
      }

      // AVERAGE ATTEMPS

      if (attempts[key] === undefined) {
        attempts[key] = 1;
      } else {
        attempts[key] += 1;
      }

      // max attempted problem
      if (attempts[key] > max_attempts) {
        max_attempted_problem = `${contestId}-${level}`;
        max_attempts = attempts[key];
      }

      // problem with solved count map
      if (submission.verdict === "OK") {
        if (problem_solved_count[key] === undefined) {
          problem_solved_count[key] = 1;
        } else {
          problem_solved_count[key] += 1;
        }
      }

      // max number of solved count for a problem
      if (problem_solved_count[key] > max_ac) {
        max_ac = problem_solved_count[key];
        max_ac_problem_name = `${contestId}-${level}`;
      }

      // HEATMAP CALCULATION
      const submissionTimeMs = submission.creationTimeSeconds * 1000;
      const submissionDate = new Date(submissionTimeMs);
      submissionDate.setHours(0, 0, 0, 0);

      // console.log("submissionDate => ", submissionDate.valueOf())

      if (heatmap[submissionDate.valueOf()] === undefined) {
        heatmap[submissionDate.valueOf()] = 1;
      } else {
        heatmap[submissionDate.valueOf()] += 1;
      }
    }

    years =
      new Date(response.result[0].creationTimeSeconds * 1000).getYear() -
      new Date(response.result.at(-1).creationTimeSeconds * 1000).getYear();
    years = Math.abs(years) + 1;

    console.log(verdict);
    console.log(language);
    // console.log("heatmap => ", heatmap)
    hideLoader()
    showContent()

    const targetDiv = document.querySelector('#lang-verd');
    targetDiv.scrollIntoView({ behavior: 'smooth' });

    // loader.style.display = "none"
    createUnSolvedProblems();
    drawVerdictChart();
    drawLanguageChart();
    drawTagsChart();
    drawRatingChart();
    drawLevelsChart()
    drawContestStatsTable();
    drawHeatMap();


  } catch (err) {
    // loader.style.display = "none"
    console.log(err);
    showError()
    hideLoader()
  }
}


function drawContestStatsTable() {
  console.log("Running", attempts);
  let contest_stats_div = document.getElementById("contest-stats");
  const usernameTh = document.querySelectorAll(".username");

  for (let i of usernameTh) {
    i.innerHTML = username;
  }
  contest_stats_div.style.display = "flex";

  console.log("contest_stats_div", contest_stats_div);
  console.log("contest_stats_div.classList", contest_stats_div.classList);

  let contest_stats_tbody = document.getElementById("contest-stats-table-body");

  let total_attempts = 0;
  for (let i in attempts) {
    total_attempts += attempts[i];
  }

  let average_attempt = total_attempts / tried.size;

  let problems_with_one_submission = 0;
  let all_accepted_submission_count = 0;

  for (let i in problem_solved_count) {
    if (problem_solved_count[i] > 0 && attempts[i] === 1) {
      problems_with_one_submission += 1;
    }

    all_accepted_submission_count += problem_solved_count[i];
  }
  // const ans = Object.values(problem_solved_count).reduce(
  //   (currentsum, value) => (currentsum += value)
  // );

  const problem_with_one_ac_sub_per =
    problems_with_one_submission / solved.size;

  contest_stats_tbody.innerHTML = `
    <tr>
      <td>Tried</td>
      <td class='value-td'>${tried.size}</td>
    </tr>
    <tr>
      <td>Solved</td>
      <td class='value-td'>${solved.size}</td>
    </tr>
    <tr>
      <td>Average Attempts</td>
      <td class='value-td'>${average_attempt.toFixed(2)}</td>
    </tr>
    <tr>
      <td>Max Attempts</td>
      <td class='value-td'>${max_attempts} (${max_attempted_problem})</td>
    </tr>
    <tr>
      <td>Solved With One Submission</td>
      <td class='value-td'>${problems_with_one_submission} (${problem_with_one_ac_sub_per.toFixed(
    2
  )}%)</td>
    </tr>
    <tr>
      <td>Max AC(s)</td>
      <td class='value-td'>${max_ac} (${max_ac_problem_name})</td>
    </tr>
  `;
}

function drawVerdictChart() {
  const verdictDiv = document.getElementById("verdict-chart");

  var verTable = [["Verdict", "Count"]];

  var verSliceColors = [];
  // beautiful names for the verdicts + colors

  for (var ver in verdict) {
    // console.log(ver);

    if (ver == "OK") {
      verTable.push(["AC", verdict[ver]]);

      verSliceColors.push({ color: "#FFC3A0" });
    } else if (ver == "WRONG_ANSWER") {
      verTable.push(["WA", verdict[ver]]);

      verSliceColors.push({ color: "#FF677D" });
    } else if (ver == "TIME_LIMIT_EXCEEDED") {
      verTable.push(["TLE", verdict[ver]]);
      verSliceColors.push({ color: "#D4A5A5" });
    } else if (ver == "MEMORY_LIMIT_EXCEEDED") {
      verTable.push(["MLE", verdict[ver]]);
      verSliceColors.push({ color: "#392F5A" });
    } else if (ver == "RUNTIME_ERROR") {
      verTable.push(["RTE", verdict[ver]]);
      verSliceColors.push({ color: "#31A2AC" });
    } else if (ver == "COMPILATION_ERROR") {
      verTable.push(["CPE", verdict[ver]]);
      verSliceColors.push({ color: "#61C0BF" });
    } else if (ver == "SKIPPED") {
      verTable.push(["SKIPPED", verdict[ver]]);
      verSliceColors.push({ color: "#6B4226" });
    } else if (ver == "CLALLENGED") {
      verTable.push(["CLALLENGED", verdict[ver]]);
      verSliceColors.push({ color: "#D9BF77" });
    } else {
      verTable.push([ver, verdict[ver]]);
      verSliceColors.push({});
    }
  }

  //   console.log(verTable);
  verdict = new google.visualization.arrayToDataTable(verTable);

  var verOptions = {
    height: 300,
    width: Math.max(verdictDiv.getBoundingClientRect().width, 500),
    title: "Verdict of " + username,
    legend: "none",
    pieSliceText: "label",
    slices: verSliceColors,
    fontName: "monospace",
    backgroundColor: "white",
    titleTextStyle: { color: "#212529", fontSize: "16" },
    legend: {
      textStyle: {
        color: "#212529",
      },
    },
    is3D: true,
  };

  var verChart = new google.visualization.PieChart(verdictDiv);
  verChart.draw(verdict, verOptions);
}

function drawLanguageChart() {
  const langDiv = document.getElementById("language-chart");
  const langData = [["Language", "Count"]];

  for (let lang in language) {
    langData.push([lang, language[lang]]);
  }


  language = new google.visualization.arrayToDataTable(langData);

  const languageChartOptions = {
    width: Math.max(langDiv.getBoundingClientRect().width, 500),
    height: 300,
    title: `Languages of ${username}`,
    pieSliceText: "label",
    fontName: "monospace",
    backgroundColor: "white",
    is3D: true,
  };

  const langChart = new google.visualization.PieChart(langDiv);
  langChart.draw(language, languageChartOptions);
}

function drawTagsChart() {
  console.log("tags", tags)

  let tagDiv = document.getElementById("tags");

  let tagTable = [];
  for (let tag in tags) {
    tagTable.push([tag + ': ' + tags[tag], tags[tag]]);
  }
  tagTable.sort(function (a, b) {
    return b[1] - a[1];
  });
  tags = new google.visualization.DataTable();
  tags.addColumn('string', 'Tag');
  tags.addColumn('number', 'solved');
  tags.addRows(tagTable);
  var tagOptions = {
    width: Math.max(tagDiv.getBoundingClientRect().width, 500),
    height: 300,
    chartArea: { width: '80%', height: '70%' },
    title: 'Tags of ' + username,
    pieSliceText: 'none',
    legend: {
      position: 'right',
      alignment: 'center',
      textStyle: {
        fontSize: 12,
        fontName: 'monospace'
      }
    },
    pieHole: 0.5,
    tooltip: {
      text: 'percentage'
    },
    fontName: 'monospace',
  };
  var tagChart = new google.visualization.PieChart(tagDiv);
  tagChart.draw(tags, tagOptions);
}

function drawRatingChart() {
  const ratingDiv = document.querySelector(".ratingchart-div");
  const ratingTable = [];

  console.log("ratings", ratings)

  for (let rating in ratings) {
    ratingTable.push([rating, ratings[rating]]);
  }

  ratings = new google.visualization.DataTable();
  ratings.addColumn("string", "Rating");
  ratings.addColumn("number", "solved");
  ratings.addRows(ratingTable);

  const ratingChartOptions = {
    width: Math.max(ratingDiv.getBoundingClientRect().width, 500),
    height: 400,
    title: `Problem ratings of ${username}`,
    fontName: "monospace",
  };

  const ratingChart = new google.visualization.ColumnChart(ratingDiv);
  ratingChart.draw(ratings, ratingChartOptions);
}

function drawLevelsChart() {

  const levelsDiv = document.querySelector(".levelschart-dev");

  let levels = {}
  const levelsTable = []
  for (let i of solved.values()) {
    const level = i.split("-").at(-1)[0]
    if (levels[level] === undefined) {
      levels[level] = 1;
    } else {
      levels[level] += 1;
    }
  }


  for (let level in levels) {
    levelsTable.push([level, levels[level]]);
  }

  levels = new google.visualization.DataTable();
  levels.addColumn("string", "Level");
  levels.addColumn("number", "solved");
  levels.addRows(levelsTable);

  const levelChartOptions = {
    width: Math.max(levelsDiv.getBoundingClientRect().width, 500),
    height: 400,
    title: `Problem Levels of ${username}`,
    fontName: "monospace",
  };

  const levelChart = new google.visualization.ColumnChart(levelsDiv);
  levelChart.draw(levels, levelChartOptions);


  console.log("solved", levels)
}

function drawHeatMap() {
  const heatMapDiv = document.getElementById("heatmap");
  // const heatMapContainerDiv = document.getElementById("heatmap-div");
  // heatMapContainerDiv.style.display = "flex"
  const heatmapTable = [];

  for (const d in heatmap) {
    heatmapTable.push([new Date(parseInt(d)), heatmap[d]]);
  }

  heatmapData = new google.visualization.DataTable();
  heatmapData.addColumn({ type: "date", id: "Date" });
  heatmapData.addColumn({ type: "number", id: "Submissions" });

  heatmapData.addRows(heatmapTable);

  heatmap = new google.visualization.Calendar(heatMapDiv);
  var heatmapOptions = {
    height: years * 140 + 30,
    width: 900,
    fontName: "Monospace",
    titleTextStyle: { color: "#212529", fontSize: "16" },
    legend: {
      textStyle: {
        color: "#212529",
      },
    },
    colorAxis: {
      minValue: 0,
      colors: ["#9be9a8", "#30a14e", "#216e39"],
    },
    calendar: {
      cellSize: 15,
    },
  };

  heatmap.draw(heatmapData, heatmapOptions);
}

function createUnSolvedProblems() {
  let unsolved = ``;
  for (const i of tried.values()) {
    if (solved.has(i)) {
      continue;
    } else {
      const problem = i.split("-");
      let problemName = `${problem[0]}-${problem.at(-1)}`;
      unsolved += `<span>${problemName}</span> | `;
    }
  }

  let unsolvedProblemsDiv = document.getElementById("unsolved-problems");

  unsolvedProblemsDiv.innerHTML = unsolved;
}

function createUserContestStatsTable(response2) {
  let tableBody = document.getElementById("user-contest-stats-table-body");
  let totalNoOfContests = response2.result.length;
  let bestRank = Infinity;
  let bestRankText = "";
  let worstRank = 0;
  let worstRankText = "";
  let maxUp = 0;
  let maxDown = 0;
  let ratingChangeArray = [];

  for (let i of response2.result) {
    if (bestRank > i.rank) {
      bestRankText = `${i.rank} (${i.contestId})`;
      bestRank = i.rank;
    }

    if (worstRank < i.rank) {
      worstRankText = `${i.rank} (${i.contestId})`;
      worstRank = i.rank;
    }

    ratingChangeArray.push(i.newRating - i.oldRating);

    ratingChangeArray.sort();

    maxDown = ratingChangeArray[0];
    maxUp = ratingChangeArray.at(-1);

    tableBody.innerHTML = `
    <tr>
      <td>Number of contests</td>
      <td class='value-td'>${totalNoOfContests}</td>
    </tr>
    <tr>
      <td>Best rank</td>
      <td class='value-td'>${bestRankText}</td>
    </tr>
    <tr>
      <td>Worst rank</td>
      <td class='value-td'>${worstRankText}</td>
    </tr>
    <tr>
      <td>Max up</td>
      <td class='value-td'>${maxUp}</td>
    </tr>
    <tr>
      <td>Max Down</td>
      <td class='value-td'>${maxDown}</td>
    </tr>
  `;
  }
}

function showLoader() {
  loader.classList.remove("d-none");
}

function hideLoader() {
  loader.classList.add("d-none");
}

function showContent() {
  
  const content = document.getElementById("content")
  content.classList.remove("d-none")

}

function hideContent() {
  const content = document.getElementById("content")
  content.classList.add("d-none")
}


function showError() {
  const content = document.getElementById("content")
  content.classList.remove("d-none")
  content.innerHTML = `
  <div class="alert alert-danger d-flex align-items-center" role="alert">
  <svg class="bi flex-shrink-0 me-2" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>
  <div>
    Something went wrong!
  </div>
</div>
  `
}