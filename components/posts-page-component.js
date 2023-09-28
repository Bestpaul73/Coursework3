import { USER_POSTS_PAGE } from "../routes.js";
import { renderHeaderComponent } from "./header-component.js";
import { user, posts, getToken, goToPage, page } from "../index.js";
import { formatDistanceToNow } from "date-fns";
import { postLike, postDislike, delPost } from "../api.js";
let coordY = 0;
let tooltipElem;

export function renderPostsPageComponent({ appEl }) {
  // TODO: реализовать рендер постов из api - реализован.
  console.log("Актуальный список постов:", posts);

  const appHtml = posts
    .map((post) => {
      return `
      <div class="page-container">
        <div class="header-container"></div>
        <ul class="posts">
          <li class="post">
            <div class="post-header" data-user-id=${post.user.id}>
                <img src=${post.user.imageUrl} class="post-header__user-image">
                <p class="post-header__user-name">${post.user.name}</p>
            </div>
            <div class="post-image-container">
              <img data-post-id=${post.id} class="post-image" src=${
        post.imageUrl
      }>
            </div>
            <div class="post-footer">
              <div class="post-likes">
                <button data-post-id=${post.id} class="like-button">
                ${
                  post.isLiked
                    ? `<img src="./assets/images/like-active.svg">`
                    : `<img src="./assets/images/like-not-active.svg">`
                }
                </button>
                <p data-post-id=${
                  post.id
                } class="post-likes-text" data-tooltip="HTML<br>подсказка">
                  Нравится: <strong>${
                    post.likes.length > 0
                      ? `${post.likes[0].name} ${
                          post.likes.length > 1
                            ? `и еще ${post.likes.length - 1}`
                            : ``
                        }`
                      : `0`
                  }</strong>
                </p>
              </div>
              <button data-post-id=${
                post.id
              } class="bin-button"><img src="./assets/images/free-icon-delete-1345925.png" alt=""></button>  
            </div>  
            <p class="post-text">
              <span class="user-name">${post.user.name}</span>
              ${post.description}
            </p>
            <p class="post-date">
              ${formatDistanceToNow(new Date(post.createdAt))} 
            </p>
          </li>
        </ul>
      </div>
    `;
    })
    .join(``);

  appEl.innerHTML = appHtml ? appHtml : `Пока нет ни одного поста`;

  renderHeaderComponent({
    element: document.querySelector(".header-container"),
  });

  window.scrollTo(0, coordY);

  for (const userEl of document.querySelectorAll(".post-header")) {
    userEl.addEventListener("click", () => {
      goToPage(USER_POSTS_PAGE, {
        userId: userEl.dataset.userId,
      });
    });
  }

  const likeDislikePost = (postId) => {
    if (!user) {
      alert(`Ставить лайки могут только зарегистрированные пользователи`);
      return;
    }

    const post = posts.find((item) => item.id === postId);
    post.isLiked
      ? postDislike({ token: getToken(), postId }).then(() => {
          goToPage(page, { userId: post.user.id });
        })
      : postLike({ token: getToken(), postId }).then(() => {
          goToPage(page, { userId: post.user.id });
        });
  };

  for (const likeButton of document.querySelectorAll(".like-button")) {
    likeButton.addEventListener("click", () => {
      const postId = likeButton.dataset.postId;
      coordY = window.scrollY;
      likeDislikePost(postId);
    });
  }

  for (const postDeleteButton of document.querySelectorAll(".bin-button")) {
    postDeleteButton.addEventListener("click", () => {
      const postId = postDeleteButton.dataset.postId;
      const post = posts.find((item) => item.id === postId);

      if (user.name != post.user.name) {
        alert(`Вы можете удалить только свой пост`);
        return;
      }

      if (confirm(`Вы уверены, что хотите удалить свой пост?`)) {
        delPost({ token: getToken(), postId })
          .then(() => {
            coordY = window.scrollY;
            goToPage(page, { userId: post.user.id });
          })
          .catch((error) => {
            if (error.message === "Ошибка авторизации") {
              alert(error.message);
            }

            if (error.message === "Сервер сломался, попробуй позже") {
              alert(error.message);
              // Пробуем снова, если сервер сломался
              delComment({ commentID, token });
            }

            if (window.navigator.onLine === false) {
              alert("Проблемы с интернетом, проверьте подключение");
            }

            console.warn(error);
          });
      }
    });
  }

  for (const postImageEl of document.querySelectorAll(".post-image")) {
    postImageEl.addEventListener("dblclick", () => {
      coordY = window.scrollY;
      const postId = postImageEl.dataset.postId;
      likeDislikePost(postId);
    });
  }

  for (const likesTextEl of document.querySelectorAll(".post-likes-text")) {
    likesTextEl.addEventListener("mouseover", (event) => {
      const showTooltip = () => {
        const tooltipHtml = post.likes
          .map((elem) => {
            return `${elem.name}<br>`;
          })
          .join(``);

        tooltipElem = document.createElement("div");
        tooltipElem.className = "tooltip";
        tooltipElem.innerHTML = tooltipHtml;
        document.body.append(tooltipElem);

        let target = event.target;
        let coords = target.getBoundingClientRect();
        let left =
          coords.left + (target.offsetWidth - tooltipElem.offsetWidth) / 2;
        if (left < 0) left = 0; // не заезжать за левый край окна
        let top = coords.top - tooltipElem.offsetHeight - 5;
        if (top < 0) {
          // если подсказка не помещается сверху, то отображать её снизу
          top = coords.top + target.offsetHeight + 5;
        }
        tooltipElem.style.left = left + "px";
        tooltipElem.style.top = top + "px";
      };

      const postId = likesTextEl.dataset.postId;
      const post = posts.find((item) => item.id === postId);
      if (Object.keys(post.likes).length) showTooltip();
    });
  }

  for (const likesTextEl of document.querySelectorAll(".post-likes-text")) {
    likesTextEl.addEventListener("mouseout", () => {
      tooltipElem.remove();
      tooltipElem = null;
    });
  }
}
