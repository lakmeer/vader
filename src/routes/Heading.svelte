<h1> <span> Vader </span> </h1>

<style>

  h1 {
    position: relative;
    text-transform: uppercase;
    margin-top: 6rem;
    margin-bottom: 2rem;
    min-width: 100%;
    text-align: center;
    font-size: 10vw;
    letter-spacing: 0.8em;
    text-indent: 0.5em;
    font-weight: 100;
  }

  h1 span {
    position: relative;
    z-index: 1;
  }

  @supports (background-clip: text) or (-webkit-background-clip: text) {
    h1 span {
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-image: linear-gradient(to left, #f3ec78, white, #af7261, #f3ec78);
      background-size: 200%;
      animation: 15s linear infinite gradient;
    }
  }

  h1:after {
    content: "Vader";
    position: absolute;
    width: 100%;
    height: 100%;
    display: block;
    top: 0;
    left: 0;
    z-index: 0;
    text-shadow:
      0em 0.4em 0.3em rgba(0,0,0,0.5),
      0em 0.3em 0.2em rgba(0,0,0,0.4),
      0em 0.2em 0.1em rgba(0,0,0,0.3);
  }

  @keyframes gradient {
    0%   { background-position:   0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position:   0% 50%; }
  }

</style>
