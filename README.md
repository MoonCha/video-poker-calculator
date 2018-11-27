# Video Poker Return To Player(RTP) Calcualtor with Simulator

## Introduction
This program calculates or simulates some kinds of video poker games to get Return To Player(RTP) value. RTP means average expected pay when you spend unit wager 1. In other word, if you pay 100 and get 95 on average, we can call its rtp is 0.95. I heard 1 - RTP is called house edge maybe?

This program is implemented based on https://wizardofodds.com/games/video-poker/methodology/ article. However, I skipped `Using this same logic the number of different kinds of starting hands can be cut from 2,598,960 to 134,459.` part of the article, because it assumes no suit discriminated hands like `Spade Royal Straight Flush` exist. This calculator is not fast enough, but unfortunately it became far slower unfortunately.

Both rtp calculation and simulation are processed under assumption that player always replaces cards in optimal way. (except Ultimate X Poker)

## Supported Hands

Hands supported in those game rules:

- Jacks or Better
- Double Bonus
- Deuces Wild Bonus

to see all individual hand lists, see `allPayTitleToJudgeFuncMap` variable in `src/video-poker/supported-pay.ts` file.

## Supported Game Types and Features

- Plain Video Poker with 52 cards
  - RTP Calculator
  - Simulator
- Ultimate X Video Poker
  - Simulator
- Chated Poker (when you know next 5 cards)
  - Simulator

## How to use

### Prerequisite

To install dependencies, first execute `npm install` command.

> Next step might be optional, you can just use `./node_modules/ts-node/dist/bin.js` instead of `ts-node`.

Then, install ts-node and typescript globally, using commands below
```bash
npm install -g typescript@3.1.6 ts-node@7.0.1
```

### Usage

3 sample usage files exist: calculate_rtp.ts, ultimate_x_poker_simulation.ts and cheated_poker_simulation.ts

1. **Basic Video Poker RTP Calculation**

    modify pay table inside `calculate_rtp.ts` file, then execute `ts-node calculate_rtp.ts`

    default pay table looks like this:
    ```
    ROYAL_STRAIGHT_FLUSH: 250,
    STRAIGHT_FLUSH: 50,
    FOUR_OF_A_KIND: 25,
    FULL_HOUSE: 9,
    FLUSH: 6,
    STRAIGHT: 4,
    THREE_OF_A_KIND: 3,
    TWO_PAIR: 2,
    JACKS_OR_BETTER: 1,
    ```
    for example, you can modify example above like this:
    ```
    STRAIGHT_FLUSH: 100,
    FOUR_OF_A_KIND: 25,
    FULL_HOUSE: 9,
    FLUSH: 6,
    STRAIGHT: 4,
    THREE_OF_A_KIND: 3,
    TWO_PAIR: 2,
    ```
    In this case, royal straight flush flush is treated as straight flush and jacks or better will not be payed, but staright flush now pay 100x of wager.

    if you run the program without modifications, the result will be like:
    ```
    Raw result data:
    {
        "hand_count": 2598960,
        "expected_value_sum": 2556686.796702761,
        "statistics": {
            "case_count": 2598960,
            "result": {
                "ROYAL_STRAIGHT_FLUSH": 50.48376865053717,
                "STRAIGHT_FLUSH": 275.25591095863285,
                "FOUR_OF_A_KIND": 6141.983483285694,
                "FULL_HOUSE": 29894.93966931592,
                "FLUSH": 31153.18406377575,
                "STRAIGHT": 28637.368102899087,
                "THREE_OF_A_KIND": 193276.5846772999,
                "TWO_PAIR": 335232.64616746036,
                "JACKS_OR_BETTER": 555935.391729087
            }
        }
    }
    -----------------------------
    [ROYAL_STRAIGHT_FLUSH]
        Frequency: 1 for 51481.10114343347
        Probability: 0.000019424603937935624
        Pay: 250
        RTP: 0.004856150984483907
    [STRAIGHT_FLUSH]
        Frequency: 1 for 9441.977071259289
        Probability: 0.00010591002206984058
        Pay: 50
        RTP: 0.0052955011034920285
    [FOUR_OF_A_KIND]
        Frequency: 1 for 423.14669309557786
        Probability: 0.002363246638380619
        Pay: 25
        RTP: 0.059081165959515486
    [FULL_HOUSE]
        Frequency: 1 for 86.93645241463942
        Probability: 0.011502654780880014
        Pay: 9
        RTP: 0.10352389302792013
    [FLUSH]
        Frequency: 1 for 83.42518038218812
        Probability: 0.011986788586117427
        Pay: 6
        RTP: 0.07192073151670456
    [STRAIGHT]
        Frequency: 1 for 90.75414998548334
        Probability: 0.011018779859212565
        Pay: 4
        RTP: 0.04407511943685026
    [THREE_OF_A_KIND]
        Frequency: 1 for 13.446843570519926
        Probability: 0.07436689471069192
        Pay: 3
        RTP: 0.22310068413207576
    [TWO_PAIR]
        Frequency: 1 for 7.7527055604892645
        Probability: 0.12898722803254392
        Pay: 2
        RTP: 0.25797445606508784
    [JACKS_OR_BETTER]
        Frequency: 1 for 4.674931725279508
        Probability: 0.21390686725809055
        Pay: 1
        RTP: 0.21390686725809055
    total RTP: 0.9837345694827012
    ```

2. **Ultimate X Poker Simulation**

    modify pay table, multiplier table and iteration count inside `ultimate_x_poker_simulation.ts` file, then execute `ultimate_x_poker_simulation.ts`

    pay table modification is described above, then skip decribtion for that.

    Ultimate X Video Poker has special feature. When you win with some hand, your next game pay will be multiplied by some exent as written in multiplier table.

    multiplier table has the same shape as pay table (which is required).

    default multiplier table looks like this:
    ```
    ROYAL_STRAIGHT_FLUSH: 7,
    STRAIGHT_FLUSH: 7,
    FOUR_OF_A_KIND: 3,
    FULL_HOUSE: 12,
    FLUSH: 11,
    STRAIGHT: 7,
    THREE_OF_A_KIND: 4,
    TWO_PAIR: 3,
    JACKS_OR_BETTER: 2,
    ```

    With this multiplier table, if you win with flush, then next game pay will be multilied by 11.
    
    also, as this sample usage is for simulation, you can set game iteration count. modify `const trialCount = 10000000;` part which located in bottom of the code. dfeault iteration count is 10M.

3. **Cheated Poker Simulation**

    Cheated poker is the same with basic poker game, except that player knows what next 5 cards are. To simulate games for such cheated player, execute `ts-node cheated_poker_simulation.ts`.

    setting parts are the same as describe in other sample usage file descriptions, thus skip description for this one.

You can arbitrarily modify those sample files or create new ones. However be careful when you modify pay tables very strangely (especially when you handle deuces wild hands, those hands are implemented in ugly way). Many unexpected results can occur. I recommend you to understand how pay-calculator works.

## TODO
- reconstruct file structures (merge, split, hierarchy)
