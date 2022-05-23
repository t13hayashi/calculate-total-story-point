const mainFunction = () => {

    const RESULT_ELEMENT_CLASS_NAME = 'totalStoryPointText';
    const RESULT_TEXT_STYLE = 'color: orange; margin-left: 12px; font-weight: bold;';
    const RESULT_ERROR_STYLE = 'color: red; margin-left: 12px;';
    const RESULT_ERROR_MESSAGE = 'Cannot Calculate';
    const STORY_POINT_COLUMN_NAME = 'Story Point';

    const getStoryPointColumnNumber = () => {
        const tableColumnTextElements = document.querySelectorAll('[role=columnheader] span[class^=Text]');
        const tableColumnTextArray = Array.from(tableColumnTextElements).map(element => element.textContent);
        const storyPointIndex = tableColumnTextArray.indexOf(STORY_POINT_COLUMN_NAME);
        if (storyPointIndex === -1) {
            throw new Error();
        }
        return storyPointIndex + 2;
    }

    const createResultElement = (style, text) => {
        const element = document.createElement('span');
        element.className = RESULT_ELEMENT_CLASS_NAME;
        element.style.cssText = style;
        element.textContent = text
        return element;
    }

    // Story Point が格納されている列番号を設定
    let storyPointColumnNumber;
    try {
        storyPointColumnNumber = getStoryPointColumnNumber();
    } catch(e) {
        alert('Cannot find Story Point column.')
        return;
    }

    const iterations = document.querySelectorAll('[data-test-id^=table-group-Iteration]');
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
        const iterationHeader = iteration.querySelector('[data-test-id^=table-group-header-Iteration]');

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

        let totalStoryPoint = 0;
        tableRows.forEach(tableRow => {
            const storyPointSpanElement = tableRow.querySelector('[role="cell"]:nth-of-type(' + storyPointColumnNumber + ') span');
            if (storyPointSpanElement === null) {
                return;
            }
            // StoryPointを取得
            // 「10,20」のようにカンマ区切りで複数の値が入力されている場合、最後の値を使用する
            const storyPointTextArray = storyPointSpanElement.textContent.split(',');
            const storyPoint = parseInt(storyPointTextArray[storyPointTextArray.length - 1]);
            totalStoryPoint += storyPoint;
        });
        iterationHeader.appendChild(createResultElement(RESULT_TEXT_STYLE, totalStoryPoint.toString()))
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