---
layout: default
title: Posts
permalink: /posts/
---

<div class="layout">
  {% include sidebar.html %}
  <main class="content">
    <div class="section-title">All Posts</div>
    <ul class="post-list">
      {% for post in site.posts %}
        <li class="post-item">
          <div class="post-row">
            <span class="post-date">[{{ post.date | date: "%Y-%m-%d" }}]</span>
            <a class="post-link" href="{{ post.url | relative_url }}">{{ post.title }}</a>
          </div>
          {% if post.project %}
            <div class="post-meta">project: {{ post.project }}</div>
          {% endif %}
          <div class="post-separator" aria-hidden="true"></div>
        </li>
      {% endfor %}
    </ul>
  </main>
</div>
