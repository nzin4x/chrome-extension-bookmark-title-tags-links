/* eslint-disable no-unused-vars */
// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

async function get_current_url() {
    try {
        return await new Promise((resolve, reject) => {
            chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
                const currentTab = tabs[0];
                const currentUrl = currentTab.url;
                resolve(currentUrl);
            });
        });
    } catch (error) {
        console.error("Error getting current URL:", error);
        return null;
    }
}

// Search the bookmarks when entering the search keyword.
// Get the bookmarks and display them in the popup
chrome.bookmarks.getTree(async (tree) => {
    const current_url = await get_current_url()

    // console.log('current url in tree navigating', current_url)

    const node = await grep_node(tree[0].children, current_url);

    // tokenize node and order by url and starts with sharp
    if (node) {
        const tokens = await tokenizeAndOrder(node)
        console.log(tokens)

        const tokenarea = document.getElementById('bookmark_current_url')

        // Create an <h1> for hashtags
        const tags_title = document.createElement('h1');
        tags_title.textContent = 'Hashtags';
        tokenarea.appendChild(tags_title);

        // Create a <ul> for tags
        const ul = document.createElement('ul');
        for (const hashtag of tokens.hashtags) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#'; // Replace with the actual link if needed
            a.textContent = hashtag;
            li.appendChild(a);
            ul.appendChild(li);
        }
        tokenarea.appendChild(ul);

        const links_title = document.createElement('h1');
        links_title.textContent = 'Links';
        tokenarea.appendChild(links_title);
        // You can similarly create other elements for URLs and others
        // Example: Create a <ul> for URLs
        const urlUl = document.createElement('ul');
        for (const url of tokens.urls) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = url;
            a.textContent = url;
            a.target = '_blank';
            li.appendChild(a);
            urlUl.appendChild(li);
        }
        tokenarea.appendChild(urlUl);

        // Example: Create a <p> for other tokens

        const h1_3 = document.createElement('h1');
        h1_3.textContent = 'Others';
        tokenarea.appendChild(h1_3);
        const p = document.createElement('p');
        p.textContent = `${tokens.others.join(' ')}`;
        tokenarea.appendChild(p);

    }
});

async function tokenizeAndOrder(node) {
    const nodeTitle = node.title
    // Split the title into tokens using space as delimiter
    const tokens = nodeTitle.split(' ');

    // Initialize empty arrays for different token types
    const hashtags = [];
    const urls = [];
    const others = [];

    // Loop through each token and sort them into respective arrays
    for (const token of tokens) {
        if (token.startsWith('#') > 0) {
            hashtags.push(token);
        } else if (token.indexOf('://') > 0) {
            urls.push(token);
        } else {
            others.push(token);
        }
    }

    // Sort hashtags alphabetically (optional)
    hashtags.sort();
    urls.sort()
    // others.sort()

    // Combine all token arrays into a single ordered array
    return {hashtags, urls, others}
}


// Recursively display the bookmarks
function grep_node(nodes, match_url, depth = 1) {

    // console.log('grep_node depth', depth, 'for nodes', nodes)

    for (const node of nodes) {
        // If the node is a bookmark, create a list item and append it to the parent node
        // console.log('node url ', node.url)
        if (node.url && node.url === match_url) {
            // console.log('yes', node)
            return node
        }

        // If the node has children, recursively display them
        if (node.children) {
            // console.log('dive deeper', node, 'with children length', node.children.length)
            const matchnode = grep_node(node.children, match_url, ++depth);
            if (matchnode) {
                return matchnode
            }
        }
    }
}

// Add a bookmark for www.google.com
function addBookmark() {
    chrome.bookmarks.create(
        {
            parentId: '1',
            title: 'Google',
            url: 'https://www.google.com'
        },
        () => {
            console.log('Bookmark added');
            location.reload(); // Refresh the popup
        }
    );
}

// Remove the bookmark for www.google.com
function removeBookmark() {
    chrome.bookmarks.search({url: 'https://www.google.com/'}, (results) => {
        for (const result of results) {
            if (result.url === 'https://www.google.com/') {
                chrome.bookmarks.remove(result.id, () => {
                });
            }
        }
        location.reload();
    });
}

// Add click event listeners to the buttons
// document.getElementById('addButton').addEventListener('click', addBookmark);
// document.getElementById('removeButton').addEventListener('click', removeBookmark);

// Recursively display the bookmarks
function displayBookmarks(nodes, parentNode) {
    for (const node of nodes) {
        // If the node is a bookmark, create a list item and append it to the parent node
        if (node.url) {
            const listItem = document.createElement('li');
            listItem.textContent = node.title;
            parentNode.appendChild(listItem);
        }

        // If the node has children, recursively display them
        if (node.children) {
            const sublist = document.createElement('ul');
            parentNode.appendChild(sublist);
            displayBookmarks(node.children, sublist);
        }
    }
}
