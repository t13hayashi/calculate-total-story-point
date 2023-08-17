const mainFunction = () => {

    const RESULT_ELEMENT_CLASS_NAME = 'totalStoryPointText';
    const TOTAL_POINT_TEXT_STYLE = 'color: orange; margin-left: 12px; font-weight: bold;';
    const ASSIGNEE_POINT_TEXT_STYLE = 'margin-left: 12px;';
    const RESULT_ERROR_STYLE = 'color: red; margin-left: 12px;';
    const RESULT_ERROR_MESSAGE = 'Cannot Calculate';
    const STORY_POINT_COLUMN_NAME = 'Story Point';
    const ASSIGNEES_COLUMN_NAME = 'Assignees';

    const getColumnNumber = (column_name) => {
        const tableColumnTextElements = document.querySelectorAll('[role=columnheader] span[class^=Text]');
        const tableColumnTextArray = Array.from(tableColumnTextElements).map(element => element.textContent);
        const columnIndex = tableColumnTextArray.indexOf(column_name);
        if (columnIndex === -1) {
            throw new Error();
        }
        return columnIndex + 2;
    }

    const createResultElement = (style, text) => {
        const element = document.createElement('span');
        element.className = RESULT_ELEMENT_CLASS_NAME;
        element.style.cssText = style;
        element.textContent = text
        return element;
    }

    // 集計結果の要素を全て削除する
    document.querySelectorAll('[class=' + RESULT_ELEMENT_CLASS_NAME + ']').forEach(element => element.remove())

    // Assignees、Story Point が格納されている列番号を設定
    let assigneesColumnNumber;
    let storyPointColumnNumber;
    try {
        assigneesColumnNumber = getColumnNumber(ASSIGNEES_COLUMN_NAME);
        storyPointColumnNumber = getColumnNumber(STORY_POINT_COLUMN_NAME);
    } catch (e) {
        alert('Cannot find column.')
        return;
    }

    const iterations = document.querySelectorAll('[data-testid^=table-group-Iteration]');

    iterations.forEach(iteration => {

        // 各Iterationのブロックと行は、画面の中に入った時に生成され、画面から外れると削除される
        // 以下の場合は計算できない
        // - Iterationの中身が存在しない
        // - Iterationの中身が存在するが、全ての行のHTMLが生成されていない
        //   - 生成されていない場合：<div style="height: 184.983px;"></div>
        //   - 生成されている場合：<div style="height: unset;">...</div>

        // 各行を取得する
        const tableRows = iteration.querySelectorAll('[role="row"]');

        // Iterationの中身が存在するかチェックする
        if (tableRows.length === 0) {
            return;
        }

        // 中身がある場合、各セクションのヘッダーの横に計算結果を表示するため、ヘッダー要素を取得する
        const iterationHeader = iteration.querySelector('[data-testid^=group-header-Iteration]');

        // すでに表示されている結果がある場合は削除しておく
        const oldResultElement = iterationHeader.getElementsByClassName(RESULT_ELEMENT_CLASS_NAME)[0];
        if (oldResultElement) {
            oldResultElement.remove();
        }

        // Iterationの中身が存在するが、全ての行のHTMLが生成されていない場合はエラーメッセージを出力する
        // 空のdivが存在するかどうかをチェックする
        const iterationContent = iteration.children[0].children;
        for (const div of iterationContent) {
            if (div.innerHTML === "") {
                iterationHeader.appendChild(createResultElement(RESULT_ERROR_STYLE, RESULT_ERROR_MESSAGE));
                return;
            }
        }

        // assigneeStoryPoints = {
        //   'Aさん' => 10,
        //   'Bさん' => 5,
        //   'Cさん' => 15,
        // }
        const assigneeStoryPoints = {};
        let totalStoryPoint = 0;
        tableRows.forEach(tableRow => {
            // StoryPointを取得
            const storyPointSpanElement = tableRow.querySelector('[role="gridcell"]:nth-of-type(' + storyPointColumnNumber + ') span');
            if (storyPointSpanElement === null) {
                return;
            }

            // 「10,20」のようにカンマ区切りで複数の値が入力されている場合、最後の値を使用する
            const storyPointTextArray = storyPointSpanElement.textContent.split(',');
            const storyPoint = parseFloat(storyPointTextArray[storyPointTextArray.length - 1]);
            totalStoryPoint += storyPoint;

            // Assigneeを取得
            const assigneesSpanElements = tableRow.querySelectorAll('[role="gridcell"]:nth-of-type(' + assigneesColumnNumber + ') [class^=Text]');
            if (assigneesSpanElements.length === 0) {
                return;
            }

            // 複数人アサインされている場合、「A and B」「A, B, and C」の形式の文字列が格納されるため、不要な文字列を消す
            const assigneesTextArray = assigneesSpanElements[assigneesSpanElements.length - 1]
              .textContent
              .replaceAll('and', '')
              .replaceAll(',', '')
              .split(' ')
              .filter(assignee => assignee)
              .map(assignee => assignee.trim());

            assigneesTextArray.forEach(assignee => {
                if (assignee in assigneeStoryPoints) {
                    assigneeStoryPoints[assignee] += storyPoint / assigneesTextArray.length;
                } else {
                    assigneeStoryPoints[assignee] = storyPoint / assigneesTextArray.length;
                }
            })
        });

        // 全体のストーリーポイントの合計を表示する
        iterationHeader.appendChild(
          createResultElement(
            TOTAL_POINT_TEXT_STYLE,
            totalStoryPoint.toString()
          )
        )

        // 人ごとのストーリーポイントの合計を表示する
        Object.keys(assigneeStoryPoints).forEach(assignee => {
            iterationHeader.appendChild(
              createResultElement(
                ASSIGNEE_POINT_TEXT_STYLE,
                assignee + ' : ' + assigneeStoryPoints[assignee].toFixed(1)
              )
            )
        });
    })
};

chrome.action.onClicked.addListener((tab) => {
    if(!tab.url.includes("chrome://")) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: mainFunction
        });
    }
});